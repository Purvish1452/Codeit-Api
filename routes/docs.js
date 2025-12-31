const express = require('express');
const router = express.Router();

// API Documentation route
router.get('/', (req, res) => {
  const documentation = {
    title: "CodeIt API Documentation",
    version: "1.0.0",
    description: "A comprehensive API for fetching competitive programming user data from various platforms",
    baseUrl: `${req.protocol}://${req.get('host')}`,
    lastUpdated: new Date().toISOString(),
    
    platforms: {
      codechef: {
        name: "CodeChef",
        description: "Web scraping based data extraction from CodeChef profiles",
        endpoints: [
          {
            method: "GET",
            path: "/api/codechef/user/{username}",
            description: "Get comprehensive user profile data from CodeChef",
            parameters: {
              username: {
                type: "string",
                required: true,
                description: "CodeChef username",
                example: "shreymehta"
              }
            },
            responseExample: {
              platform: "codechef",
              username: "shreymehta",
              name: "Shrey Mehta",
              rating: 1604,
              stars: "3★",
              rank: "3-Star",
              country: "India",
              institution: null,
              problemsSolved: 225,
              totalProblemsCount: 225,
              ratingHistory: [
                {
                  contestName: "Starters 193 (Rated)",
                  rating: 1604,
                  ratingChange: -8,
                  rank: 1293,
                  date: "2025-07-02"
                }
              ],
              totalContests: 42,
              contestsParticipated: 42,
              profileUrl: "https://www.codechef.com/users/shreymehta",
              lastUpdated: "2025-09-24T00:00:00.000Z",
              note: "Data scraped from CodeChef profile page"
            },
            features: [
              "Complete user profile information",
              "Rating history with contest details",
              "Problems solved count",
              "Contest participation statistics",
              "Real-time data scraping"
            ]
          },
          {
            method: "GET",
            path: "/api/codechef/debug/{username}",
            description: "Debug endpoint for analyzing CodeChef page structure",
            parameters: {
              username: {
                type: "string",
                required: true,
                description: "CodeChef username for debugging",
                example: "shreymehta"
              }
            },
            responseExample: {
              username: "shreymehta",
              pageTitle: "shreymehta | CodeChef User Profile",
              allTables: 0,
              tableData: [],
              allClasses: ["user-profile-container", "rating-data-section"],
              contestKeywords: ["contest", "rating", "participated"],
              ratingKeywords: [
                {
                  text: "Total Problems Solved: 225",
                  className: "no-class",
                  tagName: "h3"
                }
              ]
            }
          }
        ]
      },
      codeforces: {
        name: "Codeforces",
        description: "Official API integration for Codeforces user data",
        endpoints: [
          {
            method: "GET",
            path: "/api/codeforces/user/{username}",
            description: "Get user profile data from Codeforces official API",
            parameters: {
              username: {
                type: "string",
                required: true,
                description: "Codeforces username (handle)",
                example: "tourist"
              }
            },
            responseExample: {
              platform: "codeforces",
              username: "tourist",
              firstName: "Gennady",
              lastName: "Korotkevich",
              name: "Gennady Korotkevich",
              email: null,
              registrationTime: 1265287020,
              lastOnline: 1735084800,
              rating: 3900,
              maxRating: 3900,
              rank: "legendary grandmaster",
              maxRank: "legendary grandmaster",
              country: "Belarus",
              city: "Gomel",
              organization: "ITMO University",
              contribution: 92,
              friendOfCount: 50000,
              titlePhoto: "https://userpic.codeforces.org/372/title/1904ded19f91a6d0.jpg",
              avatar: "https://userpic.codeforces.org/372/avatar/1904ded19f91a6d0.jpg",
              profileUrl: "https://codeforces.com/profile/tourist",
              lastUpdated: "2025-09-24T00:00:00.000Z"
            },
            features: [
              "Official API data",
              "Real-time user information",
              "Rating and rank details",
              "Profile pictures and social data",
              "Registration and activity timestamps"
            ]
          }
        ]
      },
      leetcode: {
        name: "LeetCode",
        description: "GraphQL API integration for LeetCode user profiles",
        endpoints: [
          {
            method: "GET",
            path: "/api/leetcode/user/{username}",
            description: "Get user profile data from LeetCode GraphQL API",
            parameters: {
              username: {
                type: "string",
                required: true,
                description: "LeetCode username",
                example: "shreymehta09"
              }
            },
            responseExample: {
              platform: "leetcode",
              username: "shreymehta09",
              name: "John Doe",
              summary: "Software Engineer passionate about competitive programming",
              ranking: 12345,
              reputation: 1500,
              totalSolved: 850,
              totalQuestions: 3000,
              easySolved: 400,
              mediumSolved: 350,
              hardSolved: 100,
              acceptanceRate: 85.5,
              contributionPoints: 250,
              website: "https://shreymehta09.dev",
              github: "https://github.com/shreymehta09",
              twitter: "https://twitter.com/shreymehta09",
              linkedIn: "https://linkedin.com/in/shreymehta09",
              profileUrl: "https://leetcode.com/shreymehta09",
              lastUpdated: "2025-09-24T00:00:00.000Z"
            },
            features: [
              "Complete problem-solving statistics",
              "Difficulty-wise breakdown",
              "Social media links",
              "Ranking and reputation system",
              "Profile summary and personal info"
            ]
          }
        ]
      }
    },
    
    generalEndpoints: [
      {
        method: "GET",
        path: "/api/contests",
        description: "Get upcoming contests from multiple platforms",
        responseExample: {
          upcoming: [
            {
              platform: "codeforces",
              name: "Codeforces Round #900",
              startTime: "2025-09-25T14:35:00Z",
              duration: 7200,
              url: "https://codeforces.com/contest/1900"
            }
          ]
        }
      },
      {
        method: "GET",
        path: "/docs",
        description: "This documentation page"
      }
    ],
    
    features: [
      "Multi-platform support (CodeChef, Codeforces, LeetCode)",
      "Real-time data fetching",
      "Comprehensive user profiles",
      "Contest participation history",
      "Problem-solving statistics",
      "Caching for improved performance",
      "Error handling and fallback mechanisms",
      "RESTful API design"
    ],
    
    caching: {
      description: "API responses are cached for 5 minutes to improve performance and reduce load on source platforms",
      ttl: "5 minutes (300 seconds)",
      strategy: "In-memory caching using NodeCache"
    },
    
    errorHandling: {
      description: "The API includes comprehensive error handling with fallback mechanisms",
      commonErrors: [
        {
          status: 404,
          message: "User not found",
          description: "The specified username does not exist on the platform"
        },
        {
          status: 500,
          message: "Scraping error",
          description: "Failed to fetch data from the source platform"
        },
        {
          status: 429,
          message: "Rate limit exceeded",
          description: "Too many requests to the platform API"
        }
      ]
    },
    
    usage: {
      rateLimit: "No rate limiting currently implemented",
      authentication: "No authentication required",
      cors: "CORS enabled for all origins",
      contentType: "application/json"
    },
    
    examples: [
      {
        title: "Get CodeChef User Data",
        request: "GET /api/codechef/user/shreymehta",
        description: "Fetch complete profile data for a CodeChef user"
      },
      {
        title: "Get Codeforces User Data",
        request: "GET /api/codeforces/user/tourist",
        description: "Fetch profile data from Codeforces official API"
      },
      {
        title: "Get LeetCode User Data",
        request: "GET /api/leetcode/user/shreymehta09",
        description: "Fetch profile data from LeetCode GraphQL API"
      },
      {
        title: "Get Upcoming Contests",
        request: "GET /api/contests",
        description: "Fetch upcoming contests from all supported platforms"
      }
    ],
    
    technicalDetails: {
      framework: "Express.js",
      language: "Node.js",
      scraping: "Cheerio for HTML parsing",
      httpClient: "Axios for API calls",
      caching: "NodeCache for in-memory caching",
      platforms: {
        codechef: "Web scraping (no official API)",
        codeforces: "Official REST API",
        leetcode: "GraphQL API"
      }
    },
    
    recentUpdates: [
      {
        date: "2025-09-24",
        version: "1.2.0",
        changes: [
          "Fixed contest duplication in CodeChef rating history",
          "Improved problems solved count extraction accuracy",
          "Enhanced error handling and debugging capabilities",
          "Added comprehensive API documentation"
        ]
      },
      {
        date: "2025-09-23",
        version: "1.1.0", 
        changes: [
          "Added firstName and lastName fields to Codeforces API",
          "Added summary field to LeetCode API from aboutMe",
          "Added rating history extraction for CodeChef users",
          "Updated README with latest API improvements"
        ]
      }
    ],
    
    support: {
      repository: "https://github.com/ShreyMehta09/CodeIt-api",
      issues: "https://github.com/ShreyMehta09/CodeIt-api/issues",
      contact: "Create an issue on GitHub for bug reports or feature requests"
    }
  };

  // Set content type to JSON for API response
  res.setHeader('Content-Type', 'application/json');
  res.json(documentation);
});

// HTML documentation route
router.get('/html', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeIt API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            text-align: center;
            margin-bottom: 2rem;
            border-radius: 10px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .section {
            background: white;
            margin-bottom: 2rem;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .platform {
            margin-bottom: 2rem;
            padding: 1rem;
            border-left: 4px solid #667eea;
            background-color: #f8f9fa;
        }
        
        .platform h3 {
            color: #495057;
            margin-bottom: 0.5rem;
        }
        
        .endpoint {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            margin-bottom: 1rem;
            padding: 1rem;
        }
        
        .method {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }
        
        .method.get {
            background-color: #28a745;
            color: white;
        }
        
        .path {
            font-family: 'Courier New', monospace;
            background-color: #f8f9fa;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .code {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .feature-card {
            background: #667eea;
            color: white;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .try-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 0.5rem;
        }
        
        .try-button:hover {
            background: #5a67d8;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CodeIt API</h1>
            <p>Comprehensive Competitive Programming Data API</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                Base URL: <code style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.5rem; border-radius: 4px;">${baseUrl}</code>
            </p>
        </div>

        <div class="section">
            <h2>📊 API Statistics</h2>
            <div class="stats">
                <div class="stat-card">
                    <span class="stat-number">3</span>
                    <span class="stat-label">Platforms Supported</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">5+</span>
                    <span class="stat-label">API Endpoints</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">5 min</span>
                    <span class="stat-label">Cache Duration</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">JSON</span>
                    <span class="stat-label">Response Format</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🏆 Supported Platforms</h2>
            
            <div class="platform">
                <h3>📈 CodeChef</h3>
                <p>Complete user profiles with rating history and contest participation</p>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/codechef/user/{username}</span>
                    <p style="margin-top: 0.5rem;">Get comprehensive CodeChef user data including rating history, problems solved, and contest participation.</p>
                    <a href="${baseUrl}/api/codechef/user/shreymehta" class="try-button" target="_blank">Try Example</a>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/codechef/debug/{username}</span>
                    <p style="margin-top: 0.5rem;">Debug endpoint for analyzing page structure and troubleshooting data extraction.</p>
                    <a href="${baseUrl}/api/codechef/debug/shreymehta" class="try-button" target="_blank">Try Debug</a>
                </div>
            </div>

            <div class="platform">
                <h3>🔥 Codeforces</h3>
                <p>Official API integration with real-time user data</p>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/codeforces/user/{username}</span>
                    <p style="margin-top: 0.5rem;">Fetch user profile from Codeforces official API with ratings, achievements, and social data.</p>
                    <a href="${baseUrl}/api/codeforces/user/tourist" class="try-button" target="_blank">Try Example</a>
                </div>
            </div>

            <div class="platform">
                <h3>💻 LeetCode</h3>
                <p>GraphQL integration for problem-solving statistics</p>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/leetcode/user/{username}</span>
                    <p style="margin-top: 0.5rem;">Get LeetCode profile with detailed problem-solving statistics and difficulty breakdowns.</p>
                    <a href="${baseUrl}/api/leetcode/user/shreymehta09" class="try-button" target="_blank">Try Example</a>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🌟 Key Features</h2>
            <div class="features">
                <div class="feature-card">
                    <h4>Multi-Platform</h4>
                    <p>Support for CodeChef, Codeforces, and LeetCode</p>
                </div>
                <div class="feature-card">
                    <h4>Real-Time Data</h4>
                    <p>Fresh data fetched directly from platforms</p>
                </div>
                <div class="feature-card">
                    <h4>Comprehensive Profiles</h4>
                    <p>Complete user statistics and history</p>
                </div>
                <div class="feature-card">
                    <h4>Smart Caching</h4>
                    <p>5-minute cache for optimal performance</p>
                </div>
                <div class="feature-card">
                    <h4>Error Handling</h4>
                    <p>Robust fallback mechanisms</p>
                </div>
                <div class="feature-card">
                    <h4>RESTful Design</h4>
                    <p>Clean, predictable API structure</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📝 Quick Start Examples</h2>
            
            <h4>Get CodeChef User Data:</h4>
            <div class="code">curl "${baseUrl}/api/codechef/user/shreymehta"</div>
            
            <h4>Get Codeforces User Data:</h4>
            <div class="code">curl "${baseUrl}/api/codeforces/user/tourist"</div>
            
            <h4>Get LeetCode User Data:</h4>
            <div class="code">curl "${baseUrl}/api/leetcode/user/shreymehta09"</div>
            
            <h4>Get Upcoming Contests:</h4>
            <div class="code">curl "${baseUrl}/api/contests"</div>
        </div>

        <div class="section">
            <h2>🔧 Technical Details</h2>
            <ul style="list-style-type: none; padding-left: 0;">
                <li style="margin-bottom: 0.5rem;">📦 <strong>Framework:</strong> Express.js</li>
                <li style="margin-bottom: 0.5rem;">🟢 <strong>Runtime:</strong> Node.js</li>
                <li style="margin-bottom: 0.5rem;">🌐 <strong>HTTP Client:</strong> Axios</li>
                <li style="margin-bottom: 0.5rem;">🔍 <strong>Web Scraping:</strong> Cheerio</li>
                <li style="margin-bottom: 0.5rem;">💾 <strong>Caching:</strong> NodeCache (5 minutes TTL)</li>
                <li style="margin-bottom: 0.5rem;">🔒 <strong>CORS:</strong> Enabled for all origins</li>
                <li style="margin-bottom: 0.5rem;">📋 <strong>Content-Type:</strong> application/json</li>
            </ul>
        </div>

        <div class="section">
            <h2>🆕 Recent Updates</h2>
            <div style="border-left: 4px solid #28a745; padding-left: 1rem; background-color: #f8f9fa; padding: 1rem;">
                <h4 style="color: #28a745;">Version 1.2.0 - September 24, 2025</h4>
                <ul>
                    <li>Fixed contest duplication in CodeChef rating history</li>
                    <li>Improved problems solved count extraction accuracy</li>
                    <li>Enhanced error handling and debugging capabilities</li>
                    <li>Added comprehensive API documentation</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>📞 Support & Contributing</h2>
            <p>Need help or want to contribute? Check out our GitHub repository:</p>
            <br>
            <a href="https://github.com/ShreyMehta09/CodeIt-api" target="_blank" style="background: #333; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none;">
                🔗 GitHub Repository
            </a>
            <a href="https://github.com/ShreyMehta09/CodeIt-api/issues" target="_blank" style="background: #dc3545; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; margin-left: 0.5rem;">
                🐛 Report Issues
            </a>
        </div>

        <div class="section">
            <h2>📋 Full API Reference</h2>
            <p>For complete API reference with all parameters, response schemas, and error codes:</p>
            <a href="${baseUrl}/docs" class="try-button" target="_blank">View JSON Documentation</a>
        </div>

        <footer style="text-align: center; padding: 2rem 0; color: #666; border-top: 1px solid #dee2e6; margin-top: 2rem;">
            <p>CodeIt API • Built with ❤️ for the competitive programming community</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Last updated: ${new Date().toISOString().split('T')[0]}</p>
        </footer>
    </div>
</body>
</html>`;

  res.send(html);
});

module.exports = router;