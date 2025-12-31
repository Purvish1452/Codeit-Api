const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Note: CodeChef doesn't have a public API, so we'll use web scraping approach
// In production, you might want to use puppeteer or similar for more reliable scraping

// Get user profile with proper HTML parsing
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cc_user_${username}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const profileUrl = `https://www.codechef.com/users/${username}`;
    
    try {
      const response = await axios.get(profileUrl, {
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
      
      // Extract user's full name
      let name = null;
      const nameSelectors = [
        '.user-details-container h1',
        '.user-details h1',
        '.plr10 h1',
        'h1.h2-style',
        '.user-name',
        '.user-details-container .h2-style',
        '.user-header h1',
        '.rating .text-color',
        '.user-details .text-color',
        'h1',
        '.user-details-container .rating-number',
        '.user-details-container .text-color'
      ];
      
      for (const selector of nameSelectors) {
        const nameElement = $(selector);
        if (nameElement.length > 0) {
          const nameText = nameElement.text().trim();
          // Clean up the name text - remove username if it's included
          // Skip if it's just the username, or contains rating numbers, or is too short
          if (nameText && 
              nameText !== username && 
              nameText.toLowerCase() !== username.toLowerCase() &&
              !nameText.includes('(') && 
              !/^\d+$/.test(nameText) && // Not just numbers (rating)
              !nameText.includes('★') && // Not star rating
              nameText.length > 1 &&
              nameText.length < 100) { // Reasonable name length
            name = nameText;
            break;
          }
        }
      }
      
      // Alternative approach: try to find the name from meta tags or title
      if (!name) {
        const titleElement = $('title');
        if (titleElement.length > 0) {
          const titleText = titleElement.text().trim();
          // Extract name from title like "John Doe - CodeChef"
          const titleMatch = titleText.match(/^(.+?)\s*-\s*CodeChef/i);
          if (titleMatch && titleMatch[1] && titleMatch[1] !== username) {
            name = titleMatch[1].trim();
          }
        }
      }
      
      // Another approach: look in profile section
      if (!name) {
        const profileTexts = $('.user-details, .user-details-container, .plr10').find('*').contents().filter(function() {
          return this.nodeType === 3; // Text nodes only
        });
        
        profileTexts.each((i, textNode) => {
          const text = $(textNode).text().trim();
          if (text && 
              text !== username && 
              text.length > 2 && 
              text.length < 50 &&
              !/^\d+$/.test(text) &&
              !text.includes('★') &&
              !text.includes('Rating') &&
              !text.includes('Contest') &&
              !text.includes('Problem')) {
            name = text;
            return false; // Break the loop
          }
        });
      }
      
      // Extract rating
      let rating = 0;
      const ratingElement = $('.rating-number');
      if (ratingElement.length > 0) {
        rating = parseInt(ratingElement.text().trim()) || 0;
      }
      
      // Extract stars
      let stars = 0;
      const starsElement = $('.rating-star');
      if (starsElement.length > 0) {
        stars = starsElement.length;
      }
      
      // Extract rank/division
      let rank = 'Unrated';
      const rankElement = $('.rating-title');
      if (rankElement.length > 0) {
        rank = rankElement.text().trim();
      }
      
      // Extract country
      let country = null;
      const countryElement = $('.user-country-name');
      if (countryElement.length > 0) {
        country = countryElement.text().trim();
      }
      
      // Extract institution
      let institution = null;
      const institutionElement = $('.user-institution');
      if (institutionElement.length > 0) {
        institution = institutionElement.text().trim();
      }
      
      // Extract problem solving stats with more precise approach
      let problemsSolved = 'N/A';
      
      console.log('=== DEBUGGING PROBLEMS SOLVED EXTRACTION ===');
      
      // Look for the exact "Total Problems Solved: X" pattern
      $('*').each((index, element) => {
        const text = $(element).text().trim();
        
        // Check for exact "Total Problems Solved: NUMBER" pattern
        const totalSolvedMatch = text.match(/Total\s+Problems\s+Solved:\s*(\d+)/i);
        if (totalSolvedMatch) {
          const count = parseInt(totalSolvedMatch[1]);
          console.log(`✅ Found exact "Total Problems Solved" pattern: ${count}`);
          console.log(`  Full text: "${text}"`);
          console.log(`  Element: ${element.tagName}.${$(element).attr('class') || 'no-class'}`);
          problemsSolved = count;
          return false; // Break out of loop
        }
      });
      
      // If exact pattern not found, try variations
      if (problemsSolved === 'N/A') {
        console.log('Exact pattern not found, trying variations...');
        
        $('*').each((index, element) => {
          const text = $(element).text().trim();
          
          // Try different variations of problems solved pattern
          const patterns = [
            /problems?\s*solved[:\s]*(\d+)/i,
            /solved[:\s]*(\d+)\s*problems?/i,
            /(\d+)\s*problems?\s*solved/i,
            /total[:\s]*(\d+)\s*problems?/i
          ];
          
          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
              const count = parseInt(match[1]);
              if (count > 0 && count < 2000) { // Reasonable range
                console.log(`✅ Found problems via pattern: ${count}`);
                console.log(`  Pattern: ${pattern}`);
                console.log(`  Text: "${text}"`);
                problemsSolved = count;
                return false;
              }
            }
          }
        });
      }
      
      // Final fallback: Look in page text for the pattern
      if (problemsSolved === 'N/A') {
        console.log('Trying page-wide text search...');
        const pageText = $.text();
        
        const totalSolvedMatch = pageText.match(/Total\s+Problems\s+Solved:\s*(\d+)/i);
        if (totalSolvedMatch) {
          problemsSolved = parseInt(totalSolvedMatch[1]);
          console.log(`✅ Found in page text: ${problemsSolved}`);
        }
      }
      
      // Ensure we have a numeric value
      if (problemsSolved === 'N/A') {
        console.log('❌ Could not find problems solved count, defaulting to 0');
        problemsSolved = 0;
      }
      
      console.log(`=== FINAL PROBLEMS SOLVED: ${problemsSolved} ===`);

      // Extract rating history
      const ratingHistory = [];
      const contestSet = new Set(); // To avoid duplicates
      
      // Log the page content for debugging
      console.log(`Debugging CodeChef page for user: ${username}`);
      
      // First, let's try to find any tables on the page
      const allTables = $('table');
      console.log(`Found ${allTables.length} tables on the page`);
      
      // Try multiple approaches to find rating history - be more inclusive
      const ratingSelectors = [
        '.rating-data-section table tbody tr',
        '.contest-participation-details tbody tr', 
        '.rating-timeline tbody tr',
        '.user-contest-data tbody tr',
        'table.dataTable tbody tr',
        '.contest-history tbody tr',
        '.rating-graph-container table tbody tr',
        '.contest-details tbody tr',
        '.user-details table tbody tr',
        'table tbody tr', // Generic table rows - try this early
        '.rating tbody tr',
        '.contests tbody tr'
      ];

      let historyFound = false;

      for (const selector of ratingSelectors) {
        const rows = $(selector);
        console.log(`Selector "${selector}" found ${rows.length} rows`);
        
        if (rows.length > 0) {
          let validRowsFound = 0;
          
          rows.each((index, row) => {
            try {
              const $row = $(row);
              const cells = $row.find('td, th');
              const rowText = $row.text().trim();
              
              // Skip obvious header rows
              const isHeaderRow = rowText.toLowerCase().includes('contest name') || 
                                rowText.toLowerCase().includes('rating change') ||
                                rowText.toLowerCase().includes('rank') ||
                                (rowText.toLowerCase().includes('contest') && 
                                 rowText.toLowerCase().includes('rating') && 
                                 cells.length <= 4 && 
                                 !rowText.match(/\d{3,4}/));
              
              if (isHeaderRow) {
                console.log(`Skipping header row: "${rowText}"`);
                return;
              }
              
              // Skip empty or very short rows
              if (!rowText || rowText.length < 5) {
                return;
              }
              
              // Log row content for debugging (first 10 rows only)
              if (validRowsFound < 10) {
                console.log(`Row ${validRowsFound}: "${rowText}" (${cells.length} cells)`);
              }
              
              if (cells.length >= 1) { // Be more flexible with cell count
                // Extract all text from the row
                let contestName = '';
                let contestRating = null;
                let ratingChange = null;
                let date = null;
                let rank = null;
                
                // Try to extract data from each cell
                cells.each((cellIndex, cell) => {
                  const cellText = $(cell).text().trim();
                  
                  // Look for contest name - be much more inclusive
                  if (!contestName && cellText && cellText.length > 2) {
                    // Accept any text that could be a contest name
                    if (cellText.match(/^[A-Za-z0-9\s\-_\.]+/) && 
                        !cellText.match(/^\d+$/) && 
                        !cellText.match(/^[+-]\d+$/) &&
                        !cellText.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/) &&
                        cellText.length <= 100) {
                      contestName = cellText;
                    }
                  }
                  
                  // Look for rating (3-4 digit number between 600-4000 - be more inclusive)
                  const ratingMatch = cellText.match(/\b(\d{3,4})\b/);
                  if (ratingMatch) {
                    const parsedRating = parseInt(ratingMatch[1]);
                    if (parsedRating >= 600 && parsedRating <= 4000) {
                      contestRating = parsedRating;
                    }
                  }
                  
                  // Look for rating change (+/- format)
                  const changeMatch = cellText.match(/([+-]\d+)/);
                  if (changeMatch) {
                    ratingChange = parseInt(changeMatch[1]);
                  }
                  
                  // Look for rank
                  const rankMatch = cellText.match(/^\d{1,6}$/);
                  if (rankMatch && parseInt(cellText) > 0 && parseInt(cellText) < 100000) {
                    rank = parseInt(cellText);
                  }
                  
                  // Look for date patterns
                  const dateMatch = cellText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}-\d{2}-\d{2})|(\d{2}-\w{3}-\d{4})/);
                  if (dateMatch) {
                    date = dateMatch[0];
                  }
                });
                
                // If still no contest name, try extracting from full row text
                if (!contestName && rowText) {
                  // Split by tabs, multiple spaces, or other delimiters
                  const textParts = rowText.split(/\s{2,}|\t|,/);
                  
                  for (const part of textParts) {
                    const trimmedPart = part.trim();
                    if (trimmedPart.length > 3 && 
                        !trimmedPart.match(/^\d+$/) && 
                        !trimmedPart.match(/^[+-]\d+$/) &&
                        !trimmedPart.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/) &&
                        trimmedPart.length <= 100) {
                      contestName = trimmedPart;
                      break;
                    }
                  }
                  
                  // If still no name, use the first part of the text
                  if (!contestName) {
                    const firstPart = rowText.substring(0, 50).trim();
                    if (firstPart.length > 3) {
                      contestName = firstPart;
                    }
                  }
                }

                // Create a more flexible unique identifier
                let contestId = contestName;
                if (contestRating) contestId += `_${contestRating}`;
                if (date) contestId += `_${date}`;
                if (rank) contestId += `_${rank}`;
                
                // Be more inclusive - accept if we have a name and any additional data
                const hasValidData = contestRating || ratingChange || rank || date;
                const hasValidName = contestName && 
                                   contestName.length > 2 && 
                                   contestName.length <= 100 &&
                                   !contestName.toLowerCase().includes('total') &&
                                   !contestName.toLowerCase().includes('header') &&
                                   !contestName.toLowerCase().includes('loading');
                
                if (hasValidName && hasValidData && !contestSet.has(contestId)) {
                  contestSet.add(contestId);
                  ratingHistory.push({
                    contestName: contestName,
                    rating: contestRating,
                    ratingChange: ratingChange,
                    rank: rank,
                    date: date
                  });
                  historyFound = true;
                  validRowsFound++;
                  console.log(`Valid contest ${validRowsFound}: ${contestName}, Rating: ${contestRating}, Change: ${ratingChange}, Rank: ${rank}`);
                }
              }
            } catch (parseError) {
              console.error('Error parsing rating history row:', parseError.message);
            }
          });
          
          if (historyFound && validRowsFound > 0) {
            console.log(`Successfully found ${validRowsFound} contests using selector: ${selector}`);
            break; // Stop after finding data with the first working selector
          }
        }
      }

      // Alternative approach: Look for JavaScript data in script tags (only if minimal table data found)
      if (!historyFound || ratingHistory.length < 5) {
        console.log('Trying to extract additional data from script tags...');
        const scripts = $('script');
        
        scripts.each((index, script) => {
          const scriptContent = $(script).html();
          if (scriptContent && (scriptContent.includes('rating') || scriptContent.includes('contest'))) {
            try {
              // Look for chart data or arrays that might contain contest information
              const arrayMatches = scriptContent.match(/\[[\s\S]*?\]/g);
              if (arrayMatches) {
                arrayMatches.forEach(arrayStr => {
                  try {
                    const arrayData = JSON.parse(arrayStr);
                    if (Array.isArray(arrayData) && arrayData.length > 0) {
                      arrayData.forEach((item, idx) => {
                        if (typeof item === 'object' && item && (item.rating || item.contest || item.name)) {
                          // Create more specific unique identifier - use just contest name for uniqueness
                          const contestName = item.contest || item.name || `Contest ${idx + 1}`;
                          const contestId = contestName.trim().toLowerCase().replace(/\s+/g, '_');
                          if (!contestSet.has(contestId)) {
                            contestSet.add(contestId);
                            ratingHistory.push({
                              contestName: contestName,
                              rating: item.rating || null,
                              ratingChange: item.change || null,
                              rank: item.rank || null,
                              date: item.date || null
                            });
                            console.log(`Extracted from script array: ${contestName}`);
                          }
                        }
                      });
                    }
                  } catch (e) {
                    // Skip invalid arrays
                  }
                });
              }
              
              // Only try JSON extraction if arrays didn't yield enough results
              if (ratingHistory.length < 10) {
                const jsonMatches = scriptContent.match(/\{[^{}]*(?:rating|contest|name)[^{}]*\}/gi);
                if (jsonMatches) {
                  jsonMatches.forEach((match, idx) => {
                    try {
                      const data = JSON.parse(match);
                      if ((data.rating || data.contestName || data.name)) {
                        const contestName = data.contestName || data.name || `Contest ${idx + 1}`;
                        const contestId = contestName.trim().toLowerCase().replace(/\s+/g, '_');
                        if (!contestSet.has(contestId)) {
                          contestSet.add(contestId);
                          ratingHistory.push({
                            contestName: contestName,
                            rating: data.rating || null,
                            ratingChange: data.ratingChange || null,
                            rank: data.rank || null,
                            date: data.date || null
                          });
                          console.log(`Extracted from JSON: ${contestName}`);
                        }
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  });
                }
              }
            } catch (scriptError) {
              console.error('Error parsing script data:', scriptError.message);
            }
          }
        });
      }

      // Remove only obviously invalid entries, but be much more permissive
      const filteredHistory = ratingHistory.filter(contest => {
        // Very minimal filtering - only remove clearly invalid entries
        const nameLength = contest.contestName.length;
        const hasAnyData = contest.rating || contest.ratingChange || contest.rank || contest.date;
        
        return nameLength >= 2 && nameLength <= 150 && hasAnyData;
      });

      // Sort rating history by most recent first (if dates are available) or keep original order
      filteredHistory.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return 0; // Keep original order if no dates
      });

      console.log(`Final rating history count: ${filteredHistory.length} (filtered from ${ratingHistory.length} raw entries)`);

      const result = {
        platform: 'codechef',
        username,
        name,
        rating,
        stars,
        rank,
        country,
        institution,
        problemsSolved,
        totalProblemsCount: problemsSolved, // Same as problemsSolved for consistency
        ratingHistory: filteredHistory, // Return ALL contests, don't limit to 20
        totalContests: filteredHistory.length, // This now correctly matches the actual rating history length
        contestsParticipated: filteredHistory.length, // Alias for clarity
        profileUrl,
        lastUpdated: new Date().toISOString(),
        note: 'Data scraped from CodeChef profile page'
      };

      console.log(`CodeChef API - User: ${username}, Name extracted: ${name}`);
      cache.set(cacheKey, result);
      res.json(result);
    } catch (scrapeError) {
      console.error('CodeChef scraping error:', scrapeError.message);
      res.json({
        platform: 'codechef',
        username,
        name: null,
        rating: null,
        stars: null,
        rank: null,
        country: null,
        institution: null,
        problemsSolved: null,
        ratingHistory: [],
        totalContests: 0,
        profileUrl,
        error: 'Unable to fetch data - CodeChef profile may be private or user not found',
        note: 'CodeChef does not provide a public API'
      });
    }
  } catch (error) {
    console.error('CodeChef API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Debug endpoint to inspect CodeChef page structure
router.get('/debug/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const profileUrl = `https://www.codechef.com/users/${username}`;
    
    const response = await axios.get(profileUrl, {
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
    
    // Extract debug information
    const debugInfo = {
      username,
      pageTitle: $('title').text(),
      allTables: $('table').length,
      tableData: [],
      allClasses: [],
      contestKeywords: [],
      ratingKeywords: []
    };
    
    // Analyze all tables
    $('table').each((index, table) => {
      const $table = $(table);
      const tableInfo = {
        index,
        className: $table.attr('class') || 'no-class',
        rowCount: $table.find('tr').length,
        sampleRows: []
      };
      
      // Get first 3 rows as samples
      $table.find('tr').slice(0, 3).each((rowIndex, row) => {
        const rowText = $(row).text().trim();
        if (rowText) {
          tableInfo.sampleRows.push(rowText);
        }
      });
      
      debugInfo.tableData.push(tableInfo);
    });
    
    // Get all unique class names
    $('*[class]').each((index, element) => {
      const classes = $(element).attr('class').split(' ');
      classes.forEach(cls => {
        if (cls && !debugInfo.allClasses.includes(cls)) {
          debugInfo.allClasses.push(cls);
        }
      });
    });
    
    // Look for contest-related text
    const pageText = $.text().toLowerCase();
    const contestWords = ['start', 'cook', 'lunch', 'contest', 'rating', 'participated', 'rank'];
    contestWords.forEach(word => {
      if (pageText.includes(word)) {
        debugInfo.contestKeywords.push(word);
      }
    });
    
    // Look for rating-related elements
    $('*').each((index, element) => {
      const text = $(element).text().trim();
      const className = $(element).attr('class') || '';
      
      if (text.match(/\b\d{3,4}\b/) && (className.includes('rating') || text.includes('rating'))) {
        debugInfo.ratingKeywords.push({
          text: text.substring(0, 100),
          className,
          tagName: element.tagName
        });
      }
    });
    
    // Limit arrays for response size
    debugInfo.allClasses = debugInfo.allClasses.slice(0, 50);
    debugInfo.ratingKeywords = debugInfo.ratingKeywords.slice(0, 10);
    
    res.json(debugInfo);
    
  } catch (error) {
    console.error('Debug endpoint error:', error.message);
    res.status(500).json({ error: 'Failed to debug page structure' });
  }
});

// Get user submissions (limited implementation)
router.get('/user/:username/submissions', async (req, res) => {
  try {
    const { username } = req.params;
    
    res.json({
      platform: 'codechef',
      username,
      note: 'CodeChef submissions require authentication and are not publicly accessible',
      suggestion: 'Use CodeChef API with proper authentication or consider alternative approaches',
      totalSubmissions: null,
      solvedCount: null,
      problems: []
    });
  } catch (error) {
    console.error('CodeChef submissions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get upcoming contests with proper HTML parsing
router.get('/contests/upcoming', async (req, res) => {
  try {
    const cacheKey = 'cc_upcoming_contests';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      const response = await axios.get('https://www.codechef.com/contests', {
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
      const contests = [];

      // Parse upcoming contests from the contests page
      // CodeChef typically shows contests in tables or cards
      
      // Try to find contest containers - CodeChef uses different selectors
      const contestSelectors = [
        '.dataTable tbody tr', // Table format
        '.contest-card', // Card format
        '.upcoming-contest-item', // List format
        '[data-contest-code]' // Data attribute format
      ];

      let foundContests = false;

      for (const selector of contestSelectors) {
        const contestElements = $(selector);
        
        if (contestElements.length > 0) {
          foundContests = true;
          
          contestElements.each((index, element) => {
            try {
              const $element = $(element);
              
              // Extract contest name
              let name = '';
              const nameSelectors = [
                '.contest-name',
                'td:first-child a',
                '.title',
                'h3',
                'h4',
                '.contest-title'
              ];
              
              for (const nameSelector of nameSelectors) {
                const nameEl = $element.find(nameSelector);
                if (nameEl.length > 0) {
                  name = nameEl.text().trim();
                  break;
                }
              }
              
              // Extract contest code/ID
              let contestCode = '';
              const codeSelectors = [
                '[data-contest-code]',
                'td:first-child a',
                '.contest-code'
              ];
              
              for (const codeSelector of codeSelectors) {
                const codeEl = $element.find(codeSelector);
                if (codeEl.length > 0) {
                  const href = codeEl.attr('href');
                  if (href) {
                    const match = href.match(/\/([A-Z0-9_]+)$/);
                    if (match) {
                      contestCode = match[1];
                      break;
                    }
                  }
                  contestCode = codeEl.attr('data-contest-code') || codeEl.text().trim();
                  break;
                }
              }
              
              // Extract start time
              let startTime = '';
              const timeSelectors = [
                '.start-time',
                'td:nth-child(2)',
                '.contest-start',
                '.time'
              ];
              
              for (const timeSelector of timeSelectors) {
                const timeEl = $element.find(timeSelector);
                if (timeEl.length > 0) {
                  startTime = timeEl.text().trim();
                  break;
                }
              }
              
              // Extract end time
              let endTime = '';
              const endSelectors = [
                '.end-time',
                'td:nth-child(3)',
                '.contest-end'
              ];
              
              for (const endSelector of endSelectors) {
                const endEl = $element.find(endSelector);
                if (endEl.length > 0) {
                  endTime = endEl.text().trim();
                  break;
                }
              }

              // Only add if we have at least a name
              if (name && name.length > 0) {
                const contest = {
                  name: name,
                  code: contestCode || `contest_${index + 1}`,
                  startTime: startTime || 'TBD',
                  endTime: endTime || 'TBD',
                  url: contestCode ? `https://www.codechef.com/${contestCode}` : 'https://www.codechef.com/contests',
                  platform: 'codechef'
                };
                
                contests.push(contest);
              }
            } catch (parseError) {
              console.error('Error parsing contest element:', parseError.message);
            }
          });
          
          break; // Stop after finding contests with the first working selector
        }
      }

      // If no contests found with selectors, try alternative approach
      if (!foundContests) {
        // Look for any links that might be contests
        const contestLinks = $('a[href*="/contest"], a[href*="/contests/"]');
        
        contestLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (text && text.length > 5 && !text.toLowerCase().includes('past')) {
            contests.push({
              name: text,
              code: href ? href.split('/').pop() : `contest_${index + 1}`,
              startTime: 'Check website',
              endTime: 'Check website',
              url: href ? `https://www.codechef.com${href}` : 'https://www.codechef.com/contests',
              platform: 'codechef'
            });
          }
        });
      }

      const result = {
        platform: 'codechef',
        contests: contests.slice(0, 10), // Limit to 10 contests
        totalFound: contests.length,
        lastUpdated: new Date().toISOString(),
        websiteUrl: 'https://www.codechef.com/contests',
        note: contests.length > 0 ? 'Contest data scraped successfully' : 'No upcoming contests found or page structure changed'
      };

      cache.set(cacheKey, result);
      res.json(result);
    } catch (scrapeError) {
      console.error('CodeChef contests scraping error:', scrapeError.message);
      res.json({
        platform: 'codechef',
        contests: [],
        error: 'Unable to fetch contest data - website may have changed structure',
        websiteUrl: 'https://www.codechef.com/contests',
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('CodeChef contests error:', error.message);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

module.exports = router;