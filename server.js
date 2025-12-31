const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const codeforcesRoutes = require('./routes/codeforces');
const codechefRoutes = require('./routes/codechef');
const leetcodeRoutes = require('./routes/leetcode');
const contestRoutes = require('./routes/contests');
const userRoutes = require('./routes/users');
const docsRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 8000;
  
// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/codeforces', codeforcesRoutes);
app.use('/api/codechef', codechefRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/users', userRoutes);
app.use('/docs', docsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CodeIt API - Competitive Programming Data API',
    version: '1.2.0',
    description: 'Comprehensive API for fetching user data from competitive programming platforms',
    documentation: {
      html: `${req.protocol}://${req.get('host')}/docs/html`,
      json: `${req.protocol}://${req.get('host')}/docs`
    },
    endpoints: {
      codeforces: '/api/codeforces',
      codechef: '/api/codechef', 
      leetcode: '/api/leetcode',
      contests: '/api/contests',
      users: '/api/users'
    },
    platforms: [
      {
        name: 'CodeChef',
        endpoint: '/api/codechef/user/{username}',
        example: '/api/codechef/user/shreymehta'
      },
      {
        name: 'Codeforces', 
        endpoint: '/api/codeforces/user/{username}',
        example: '/api/codeforces/user/tourist'
      },
      {
        name: 'LeetCode',
        endpoint: '/api/leetcode/user/{username}',
        example: '/api/leetcode/user/shreymehta09'
      }
    ],
    quickStart: 'Visit /docs/html for interactive documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;