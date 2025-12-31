const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

const LEETCODE_API = 'https://leetcode.com/graphql';

// GraphQL query for user profile
const getUserProfileQuery = (username) => ({
  query: `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          aboutMe
          school
          websites
          countryName
          company
          jobTitle
          skillTags
          postViewCount
          postViewCountDiff
          reputation
          reputationDiff
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }
  `,
  variables: { username }
});

// GraphQL query for user contest ranking
const getUserContestRankingQuery = (username) => ({
  query: `
    query getUserContestRanking($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
        badge {
          name
        }
      }
    }
  `,
  variables: { username }
});

// Get user profile and stats
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `lc_user_${username}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [profileResponse, contestResponse] = await Promise.all([
      axios.post(LEETCODE_API, getUserProfileQuery(username), {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      axios.post(LEETCODE_API, getUserContestRankingQuery(username), {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
    ]);

    const profileData = profileResponse.data.data?.matchedUser;
    const contestData = contestResponse.data.data?.userContestRanking;

    if (!profileData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const submitStats = profileData.submitStats?.acSubmissionNum || [];
    const easySolved = submitStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = submitStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = submitStats.find(s => s.difficulty === 'Hard')?.count || 0;

    const result = {
      platform: 'leetcode',
      username: profileData.username,
      profile: {
        realName: profileData.profile?.realName,
        ranking: profileData.profile?.ranking,
        reputation: profileData.profile?.reputation,
        company: profileData.profile?.company,
        school: profileData.profile?.school,
        countryName: profileData.profile?.countryName,
        summary: profileData.profile?.aboutMe || null
      },
      problemsSolved: {
        total: easySolved + mediumSolved + hardSolved,
        easy: easySolved,
        medium: mediumSolved,
        hard: hardSolved
      },
      contestRanking: contestData ? {
        rating: contestData.rating,
        globalRanking: contestData.globalRanking,
        attendedContestsCount: contestData.attendedContestsCount,
        topPercentage: contestData.topPercentage,
        badge: contestData.badge?.name
      } : null
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('LeetCode API error:', error.message);
    if (error.response?.status === 403) {
      res.status(403).json({ error: 'Access denied - LeetCode may be blocking requests' });
    } else {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  }
});

// Get user recent submissions
router.get('/user/:username/submissions', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 20 } = req.query;
    const cacheKey = `lc_submissions_${username}_${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {
      query: `
        query getRecentSubmissions($username: String!, $limit: Int!) {
          recentSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
            runtime
            url
            isPending
            memory
            hasNotes
            notes
          }
        }
      `,
      variables: { username, limit: parseInt(limit) }
    };

    const response = await axios.post(LEETCODE_API, query, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const submissions = response.data.data?.recentSubmissionList || [];

    const result = {
      platform: 'leetcode',
      username,
      recentSubmissions: submissions.map(sub => ({
        title: sub.title,
        titleSlug: sub.titleSlug,
        status: sub.statusDisplay,
        language: sub.lang,
        timestamp: sub.timestamp,
        runtime: sub.runtime,
        memory: sub.memory,
        url: `https://leetcode.com${sub.url}`
      }))
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('LeetCode submissions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GraphQL query for upcoming contests
const getUpcomingContestsQuery = () => ({
  query: `
    query getUpcomingContests {
      upcomingContests {
        title
        titleSlug
        startTime
        duration
        description
        cardImg
        company {
          watermark
        }
      }
    }
  `
});

// Get upcoming contests with multiple approaches
router.get('/contests/upcoming', async (req, res) => {
  try {
    const cacheKey = 'lc_upcoming_contests';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let contests = [];
    let method = 'unknown';

    // Method 1: Try GraphQL API first
    try {
      const graphqlResponse = await axios.post(LEETCODE_API, getUpcomingContestsQuery(), {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://leetcode.com/contest/',
          'Origin': 'https://leetcode.com'
        },
        timeout: 10000
      });

      if (graphqlResponse.data?.data?.upcomingContests) {
        contests = graphqlResponse.data.data.upcomingContests.map(contest => ({
          title: contest.title,
          titleSlug: contest.titleSlug,
          startTime: contest.startTime,
          duration: contest.duration,
          description: contest.description,
          url: `https://leetcode.com/contest/${contest.titleSlug}/`,
          platform: 'leetcode',
          type: 'weekly'
        }));
        method = 'graphql';
      }
    } catch (graphqlError) {
      console.log('GraphQL method failed, trying web scraping...');
    }

    // Method 2: Web scraping as fallback
    if (contests.length === 0) {
      try {
        const response = await axios.get('https://leetcode.com/contest/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        
        // Try different selectors for contest cards
        const contestSelectors = [
          '.contest-card',
          '[data-cy="contest-card"]',
          '.upcoming-contest',
          '.contest-item',
          '.swiper-slide'
        ];

        let foundContests = false;

        for (const selector of contestSelectors) {
          const contestElements = $(selector);
          
          if (contestElements.length > 0) {
            foundContests = true;
            
            contestElements.each((index, element) => {
              try {
                const $element = $(element);
                
                // Extract contest title
                let title = '';
                const titleSelectors = [
                  '.contest-title',
                  'h3',
                  'h4',
                  '.title',
                  'a[href*="/contest/"]'
                ];
                
                for (const titleSelector of titleSelectors) {
                  const titleEl = $element.find(titleSelector);
                  if (titleEl.length > 0) {
                    title = titleEl.text().trim();
                    break;
                  }
                }
                
                // Extract contest link/slug
                let titleSlug = '';
                let contestUrl = '';
                const linkEl = $element.find('a[href*="/contest/"]');
                if (linkEl.length > 0) {
                  const href = linkEl.attr('href');
                  if (href) {
                    contestUrl = href.startsWith('http') ? href : `https://leetcode.com${href}`;
                    const match = href.match(/\/contest\/([^\/]+)/);
                    if (match) {
                      titleSlug = match[1];
                    }
                  }
                }
                
                // Extract start time
                let startTime = '';
                const timeSelectors = [
                  '.contest-time',
                  '.start-time',
                  '.time',
                  '[data-time]'
                ];
                
                for (const timeSelector of timeSelectors) {
                  const timeEl = $element.find(timeSelector);
                  if (timeEl.length > 0) {
                    startTime = timeEl.text().trim() || timeEl.attr('data-time') || '';
                    break;
                  }
                }

                // Only add if we have meaningful data
                if (title && title.length > 3) {
                  contests.push({
                    title: title,
                    titleSlug: titleSlug || `contest-${index + 1}`,
                    startTime: startTime || 'Check website',
                    duration: 'Check website',
                    url: contestUrl || `https://leetcode.com/contest/`,
                    platform: 'leetcode',
                    type: 'scraped'
                  });
                }
              } catch (parseError) {
                console.error('Error parsing contest element:', parseError.message);
              }
            });
            
            method = 'scraping';
            break;
          }
        }

        // If no contests found with specific selectors, try generic approach
        if (!foundContests) {
          const contestLinks = $('a[href*="/contest/"]');
          
          contestLinks.each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            const text = $link.text().trim();
            
            if (text && text.length > 5 && href && !href.includes('/problems/')) {
              const titleSlug = href.match(/\/contest\/([^\/]+)/)?.[1];
              if (titleSlug && !titleSlug.includes('past')) {
                contests.push({
                  title: text,
                  titleSlug: titleSlug,
                  startTime: 'Check website',
                  duration: 'Check website',
                  url: `https://leetcode.com${href}`,
                  platform: 'leetcode',
                  type: 'generic'
                });
              }
            }
          });
          
          if (contests.length > 0) {
            method = 'generic_scraping';
          }
        }
      } catch (scrapeError) {
        console.error('Web scraping failed:', scrapeError.message);
      }
    }

    // Method 3: Use LeetCode's contest calendar API (if available)
    if (contests.length === 0) {
      try {
        const calendarResponse = await axios.get('https://leetcode.com/api/contests/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        if (calendarResponse.data && Array.isArray(calendarResponse.data)) {
          const now = Math.floor(Date.now() / 1000);
          contests = calendarResponse.data
            .filter(contest => contest.start_time > now)
            .map(contest => ({
              title: contest.title,
              titleSlug: contest.title_slug,
              startTime: contest.start_time,
              duration: contest.duration,
              url: `https://leetcode.com/contest/${contest.title_slug}/`,
              platform: 'leetcode',
              type: 'api'
            }));
          method = 'calendar_api';
        }
      } catch (apiError) {
        console.log('Calendar API method failed');
      }
    }

    const result = {
      platform: 'leetcode',
      contests: contests.slice(0, 10), // Limit to 10 contests
      totalFound: contests.length,
      method: method,
      lastUpdated: new Date().toISOString(),
      websiteUrl: 'https://leetcode.com/contest/',
      note: contests.length > 0 
        ? `Contest data fetched successfully using ${method}` 
        : 'No upcoming contests found or all methods failed'
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('LeetCode contests error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch contests',
      platform: 'leetcode',
      contests: [],
      websiteUrl: 'https://leetcode.com/contest/',
      lastUpdated: new Date().toISOString()
    });
  }
});

module.exports = router;