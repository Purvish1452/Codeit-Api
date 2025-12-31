const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Get aggregated user data from all platforms
router.get('/:username/aggregate', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `aggregate_${username}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    
    const platformPromises = [
      // Codeforces
      axios.get(`${baseUrl}/codeforces/user/${username}`)
        .then(response => ({ platform: 'codeforces', data: response.data, success: true }))
        .catch(error => ({ platform: 'codeforces', error: error.message, success: false })),
      
      // CodeChef
      axios.get(`${baseUrl}/codechef/user/${username}`)
        .then(response => ({ platform: 'codechef', data: response.data, success: true }))
        .catch(error => ({ platform: 'codechef', error: error.message, success: false })),
      
      // LeetCode
      axios.get(`${baseUrl}/leetcode/user/${username}`)
        .then(response => ({ platform: 'leetcode', data: response.data, success: true }))
        .catch(error => ({ platform: 'leetcode', error: error.message, success: false }))
    ];

    const results = await Promise.all(platformPromises);
    
    const aggregatedData = {
      username,
      platforms: {},
      summary: {
        totalPlatforms: 0,
        activePlatforms: 0,
        totalProblemsolved: 0,
        totalContests: 0,
        averageRating: 0
      },
      lastUpdated: new Date().toISOString()
    };

    let totalRating = 0;
    let ratingCount = 0;

    results.forEach(result => {
      aggregatedData.platforms[result.platform] = result;
      
      if (result.success) {
        aggregatedData.summary.activePlatforms++;
        
        // Extract platform-specific data
        const data = result.data;
        
        if (result.platform === 'codeforces') {
          if (data.rating) {
            totalRating += data.rating;
            ratingCount++;
          }
          aggregatedData.summary.totalContests += data.contestsParticipated || 0;
        } else if (result.platform === 'leetcode') {
          aggregatedData.summary.totalProblemsolved += data.problemsSolved?.total || 0;
          if (data.contestRanking?.rating) {
            totalRating += data.contestRanking.rating;
            ratingCount++;
          }
          aggregatedData.summary.totalContests += data.contestRanking?.attendedContestsCount || 0;
        } else if (result.platform === 'codechef') {
          if (data.rating) {
            totalRating += data.rating;
            ratingCount++;
          }
        }
      }
      
      aggregatedData.summary.totalPlatforms++;
    });

    aggregatedData.summary.averageRating = ratingCount > 0 ? Math.round(totalRating / ratingCount) : 0;

    cache.set(cacheKey, aggregatedData);
    res.json(aggregatedData);
  } catch (error) {
    console.error('Aggregate user data error:', error.message);
    res.status(500).json({ error: 'Failed to fetch aggregate user data' });
  }
});

// Compare multiple users
router.post('/compare', async (req, res) => {
  try {
    const { usernames, platforms = ['codeforces', 'leetcode', 'codechef'] } = req.body;
    
    if (!usernames || !Array.isArray(usernames) || usernames.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 usernames to compare' });
    }

    if (usernames.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 users can be compared at once' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const userPromises = usernames.map(username => 
      axios.get(`${baseUrl}/users/${username}/aggregate`)
        .then(response => ({ username, data: response.data, success: true }))
        .catch(error => ({ username, error: error.message, success: false }))
    );

    const userResults = await Promise.all(userPromises);
    
    const comparison = {
      users: userResults,
      comparison: {
        ratings: {},
        problemsSolved: {},
        contests: {}
      },
      timestamp: new Date().toISOString()
    };

    // Build comparison data
    platforms.forEach(platform => {
      comparison.comparison.ratings[platform] = [];
      comparison.comparison.problemsSolved[platform] = [];
      comparison.comparison.contests[platform] = [];
      
      userResults.forEach(user => {
        if (user.success && user.data.platforms[platform]?.success) {
          const platformData = user.data.platforms[platform].data;
          
          comparison.comparison.ratings[platform].push({
            username: user.username,
            rating: platformData.rating || platformData.contestRanking?.rating || 0
          });
          
          comparison.comparison.problemsSolved[platform].push({
            username: user.username,
            solved: platformData.solvedCount || platformData.problemsSolved?.total || 0
          });
          
          comparison.comparison.contests[platform].push({
            username: user.username,
            contests: platformData.contestsParticipated || platformData.contestRanking?.attendedContestsCount || 0
          });
        }
      });
      
      // Sort by rating/problems solved
      comparison.comparison.ratings[platform].sort((a, b) => b.rating - a.rating);
      comparison.comparison.problemsSolved[platform].sort((a, b) => b.solved - a.solved);
      comparison.comparison.contests[platform].sort((a, b) => b.contests - a.contests);
    });

    res.json(comparison);
  } catch (error) {
    console.error('User comparison error:', error.message);
    res.status(500).json({ error: 'Failed to compare users' });
  }
});

// Get user statistics
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    const { platform } = req.query;
    
    if (platform) {
      // Get stats for specific platform
      const baseUrl = `${req.protocol}://${req.get('host')}/api`;
      
      try {
        const [userResponse, submissionsResponse] = await Promise.all([
          axios.get(`${baseUrl}/${platform}/user/${username}`),
          axios.get(`${baseUrl}/${platform}/user/${username}/submissions`)
        ]);

        const stats = {
          platform,
          username,
          profile: userResponse.data,
          submissions: submissionsResponse.data,
          timestamp: new Date().toISOString()
        };

        res.json(stats);
      } catch (error) {
        res.status(404).json({ error: `User not found on ${platform}` });
      }
    } else {
      // Get aggregated stats
      const baseUrl = `${req.protocol}://${req.get('host')}/api`;
      
      try {
        const response = await axios.get(`${baseUrl}/users/${username}/aggregate`);
        res.json(response.data);
      } catch (error) {
        res.status(404).json({ error: 'User not found' });
      }
    }
  } catch (error) {
    console.error('User stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;