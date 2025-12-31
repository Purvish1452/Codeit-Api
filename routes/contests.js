const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache for 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Get all upcoming contests from all platforms
router.get('/upcoming', async (req, res) => {
  try {
    const cacheKey = 'all_upcoming_contests';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const contestPromises = [
      // Codeforces contests
      axios.get('https://codeforces.com/api/contest.list?gym=false')
        .then(response => {
          if (response.data.status === 'OK') {
            const now = Math.floor(Date.now() / 1000);
            return response.data.result
              .filter(contest => contest.phase === 'BEFORE' && contest.startTimeSeconds > now)
              .map(contest => ({
                platform: 'codeforces',
                id: contest.id,
                name: contest.name,
                type: contest.type,
                startTime: contest.startTimeSeconds,
                duration: contest.durationSeconds,
                url: `https://codeforces.com/contest/${contest.id}`
              }));
          }
          return [];
        })
        .catch(() => []),

      // Add other platforms here when their APIs are available
      Promise.resolve([]) // Placeholder for CodeChef
    ];

    const contestResults = await Promise.all(contestPromises);
    const allContests = contestResults.flat();

    // Sort by start time
    allContests.sort((a, b) => a.startTime - b.startTime);

    const result = {
      contests: allContests,
      totalCount: allContests.length,
      platforms: [...new Set(allContests.map(c => c.platform))],
      lastUpdated: new Date().toISOString()
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Contests API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// Get contests by platform
router.get('/platform/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const cacheKey = `contests_${platform}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let contests = [];

    switch (platform.toLowerCase()) {
      case 'codeforces':
        try {
          const response = await axios.get('https://codeforces.com/api/contest.list?gym=false');
          if (response.data.status === 'OK') {
            const now = Math.floor(Date.now() / 1000);
            contests = response.data.result
              .filter(contest => contest.phase === 'BEFORE' && contest.startTimeSeconds > now)
              .map(contest => ({
                platform: 'codeforces',
                id: contest.id,
                name: contest.name,
                type: contest.type,
                startTime: contest.startTimeSeconds,
                duration: contest.durationSeconds,
                url: `https://codeforces.com/contest/${contest.id}`
              }));
          }
        } catch (error) {
          console.error('Codeforces error:', error.message);
        }
        break;

      case 'codechef':
        contests = [{
          platform: 'codechef',
          note: 'CodeChef contests require web scraping',
          url: 'https://www.codechef.com/contests'
        }];
        break;

      case 'leetcode':
        contests = [{
          platform: 'leetcode',
          note: 'LeetCode contests require web scraping',
          url: 'https://leetcode.com/contest/'
        }];
        break;

      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    const result = {
      platform,
      contests,
      count: contests.length,
      lastUpdated: new Date().toISOString()
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Platform contests error:', error.message);
    res.status(500).json({ error: 'Failed to fetch platform contests' });
  }
});

module.exports = router;