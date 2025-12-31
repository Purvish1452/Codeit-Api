const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

const CODEFORCES_API = 'https://codeforces.com/api';

// Get user info and rating
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `cf_user_${username}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [userResponse, ratingResponse] = await Promise.all([
      axios.get(`${CODEFORCES_API}/user.info?handles=${username}`),
      axios.get(`${CODEFORCES_API}/user.rating?handle=${username}`)
    ]);

    if (userResponse.data.status !== 'OK') {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResponse.data.result[0];
    const ratings = ratingResponse.data.result || [];

    const result = {
      platform: 'codeforces',
      username: user.handle,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      maxRank: user.maxRank || 'unrated',
      contribution: user.contribution || 0,
      lastOnline: user.lastOnlineTimeSeconds,
      registrationTime: user.registrationTimeSeconds,
      contestsParticipated: ratings.length,
      ratingHistory: ratings.map(r => ({
        contestId: r.contestId,
        contestName: r.contestName,
        rank: r.rank,
        oldRating: r.oldRating,
        newRating: r.newRating,
        ratingUpdateTime: r.ratingUpdateTimeSeconds
      }))
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Codeforces API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get user submissions
router.get('/user/:username/submissions', async (req, res) => {
  try {
    const { username } = req.params;
    const { from = 1, count = 50 } = req.query;
    const cacheKey = `cf_submissions_${username}_${from}_${count}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(
      `${CODEFORCES_API}/user.status?handle=${username}&from=${from}&count=${count}`
    );

    if (response.data.status !== 'OK') {
      return res.status(404).json({ error: 'User not found' });
    }

    const submissions = response.data.result;
    const solvedProblems = new Set();
    const problemStats = {};

    submissions.forEach(sub => {
      const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
      
      if (sub.verdict === 'OK') {
        solvedProblems.add(problemKey);
      }

      if (!problemStats[problemKey]) {
        problemStats[problemKey] = {
          problem: sub.problem,
          attempts: 0,
          solved: false,
          firstSolvedTime: null
        };
      }
      
      problemStats[problemKey].attempts++;
      if (sub.verdict === 'OK' && !problemStats[problemKey].solved) {
        problemStats[problemKey].solved = true;
        problemStats[problemKey].firstSolvedTime = sub.creationTimeSeconds;
      }
    });

    const result = {
      platform: 'codeforces',
      username,
      totalSubmissions: submissions.length,
      solvedCount: solvedProblems.size,
      problems: Object.values(problemStats),
      recentSubmissions: submissions.slice(0, 10).map(sub => ({
        id: sub.id,
        contestId: sub.contestId,
        problem: sub.problem,
        verdict: sub.verdict,
        programmingLanguage: sub.programmingLanguage,
        creationTime: sub.creationTimeSeconds
      }))
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Codeforces submissions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get upcoming contests
router.get('/contests/upcoming', async (req, res) => {
  try {
    const cacheKey = 'cf_upcoming_contests';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`${CODEFORCES_API}/contest.list?gym=false`);
    
    if (response.data.status !== 'OK') {
      return res.status(500).json({ error: 'Failed to fetch contests' });
    }

    const now = Math.floor(Date.now() / 1000);
    const upcomingContests = response.data.result
      .filter(contest => contest.phase === 'BEFORE' && contest.startTimeSeconds > now)
      .map(contest => ({
        id: contest.id,
        name: contest.name,
        type: contest.type,
        phase: contest.phase,
        startTime: contest.startTimeSeconds,
        duration: contest.durationSeconds,
        relativeTime: contest.relativeTimeSeconds
      }))
      .sort((a, b) => a.startTime - b.startTime);

    const result = {
      platform: 'codeforces',
      contests: upcomingContests
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Codeforces contests error:', error.message);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

module.exports = router;