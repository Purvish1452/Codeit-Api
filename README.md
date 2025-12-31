
# CodeIt API - Competitive Programming Data API

A comprehensive REST API for fetching competitive programming data from Codeforces, CodeChef, and LeetCode platforms.

## 📚 Documentation

**🌐 Interactive Documentation**: [http://localhost:8000/docs/html](http://localhost:8000/docs/html)  
**📋 JSON API Reference**: [http://localhost:8000/docs](http://localhost:8000/docs)

Visit the interactive documentation for complete API reference, examples, and testing interface!

## Features

- **Multi-platform support**: Codeforces, CodeChef, and LeetCode
- **Enhanced user profiles**: Get ratings, rankings, names, and detailed profile information  
- **Problem statistics**: Track solved problems and submission history
- **Contest information**: Fetch upcoming contests
- **Rating history**: Complete contest participation and rating changes (CodeChef)
- **User comparison**: Compare multiple users across platforms
- **Caching**: Built-in caching for improved performance (5 minutes TTL)
- **Rate limiting**: Prevents API abuse
- **Comprehensive documentation**: Interactive HTML and JSON documentation

## Quick Start

1. **Start the server**:
   ```bash
   npm start
   # or
   node server.js
   ```

2. **Visit the documentation**:
   ```
   http://localhost:8000/docs/html
   ```

3. **Try an API call**:
   ```bash
   curl http://localhost:8000/api/codechef/user/shreymehta
   curl http://localhost:8000/api/codeforces/user/tourist  
   curl http://localhost:8000/api/leetcode/user/john_doe
   ```

## Recent Updates

### ✨ Version 1.2.0 - September 24, 2025
- **📖 Documentation**: Added comprehensive HTML and JSON API documentation
- **🔧 CodeChef Fixes**: Fixed contest duplication in rating history
- **📊 Accurate Counts**: Improved problems solved count extraction accuracy  
- **🐛 Bug Fixes**: Enhanced error handling and debugging capabilities
- **🎯 Data Quality**: Better validation and filtering for contest data

### ✨ Version 1.1.0 - September 23, 2025
- **Codeforces**: Added `firstName` and `lastName` fields to user profiles
- **CodeChef**: Added `name` field extraction and complete rating history
- **LeetCode**: Added `summary` field containing user's bio/about section
- **Enhanced error handling**: Better fallbacks when profile data is incomplete
- **Improved data extraction**: More robust scraping for CodeChef profiles

## API Endpoints

### 📚 Documentation Endpoints

#### Interactive HTML Documentation
```
GET /docs/html
```
Beautiful, interactive documentation with examples and testing interface.

#### JSON API Reference  
```
GET /docs
```
Complete API reference in JSON format with all endpoints, parameters, and response schemas.

#### API Information
```
GET /
```
Root endpoint with API overview and quick links to documentation.

### User Endpoints

#### Get User Profile
```
GET /api/{platform}/user/{username}
```
Platforms: `codeforces`, `codechef`, `leetcode`

**Examples:**
- `/api/codechef/user/shreymehta` - Get CodeChef profile with rating history
- `/api/codeforces/user/tourist` - Get Codeforces profile with official data  
- `/api/leetcode/user/john_doe` - Get LeetCode profile with problem stats

#### Get User Submissions
```
GET /api/{platform}/user/{username}/submissions
```

#### Get Aggregated User Data
```
GET /api/users/{username}/aggregate
```

#### Compare Users
```
POST /api/users/compare
Body: {
  "usernames": ["user1", "user2", "user3"],
  "platforms": ["codeforces", "leetcode"]
}
```

### Contest Endpoints

#### Get Upcoming Contests (All Platforms)
```
GET /api/contests/upcoming
```

#### Get Contests by Platform
```
GET /api/contests/platform/{platform}
```

#### Platform-specific Contest Endpoints
```
GET /api/codeforces/contests/upcoming
GET /api/codechef/contests/upcoming
GET /api/leetcode/contests/upcoming
```

### Health Check
```
GET /health
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```

For development:
```bash
npm run dev
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `CACHE_TTL_SECONDS`: Cache time-to-live in seconds

## API Response Examples

### Codeforces User Profile
```json
{
  "platform": "codeforces",
  "username": "tourist",
  "firstName": "Gennady",
  "lastName": "Korotkevich",
  "rating": 3729,
  "maxRating": 3979,
  "rank": "legendary grandmaster",
  "maxRank": "legendary grandmaster",
  "contribution": 114,
  "lastOnline": 1632123456,
  "registrationTime": 1500000000,
  "contestsParticipated": 150,
  "ratingHistory": [...]
}
```

### LeetCode User Profile
```json
{
  "platform": "leetcode",
  "username": "user123",
  "profile": {
    "realName": "John Doe",
    "ranking": 12345,
    "reputation": 1500,
    "company": "Tech Corp",
    "school": "University Name",
    "countryName": "United States",
    "summary": "Passionate software engineer with 5+ years of experience..."
  },
  "problemsSolved": {
    "total": 500,
    "easy": 200,
    "medium": 250,
    "hard": 50
  },
  "contestRanking": {
    "rating": 1800,
    "globalRanking": 5000,
    "attendedContestsCount": 25,
    "topPercentage": 10.5,
    "badge": "Knight"
  }
}
```

### CodeChef User Profile
```json
{
  "platform": "codechef",
  "username": "tourist",
  "name": "Gennady Korotkevich",
  "rating": 2500,
  "stars": 7,
  "rank": "7 Star",
  "country": "Belarus",
  "institution": "ITMO University",
  "problemsSolved": 150,
  "profileUrl": "https://www.codechef.com/users/tourist",
  "lastUpdated": "2025-09-21T10:30:00.000Z",
  "note": "Data scraped from CodeChef profile page"
}
```

### Aggregated User Data
```json
{
  "username": "user123",
  "platforms": {
    "codeforces": { "success": true, "data": {...} },
    "leetcode": { "success": true, "data": {...} },
    "codechef": { "success": false, "error": "User not found" }
  },
  "summary": {
    "totalPlatforms": 3,
    "activePlatforms": 2,
    "totalProblemsolved": 750,
    "totalContests": 45,
    "averageRating": 1650
  }
}
```

## Platform Limitations

### Codeforces
- ✅ Full API support
- ✅ Real-time data
- ✅ Complete user profiles with firstName/lastName
- ✅ Comprehensive submission history and ratings

### LeetCode
- ✅ GraphQL API support
- ✅ User profiles with summary/bio information
- ✅ Problem statistics and contest rankings
- ⚠️ Some contest data requires scraping

### CodeChef
- ❌ No official public API
- ✅ Web scraping for user profiles including name
- ✅ Basic stats (rating, stars, problems solved)
- ⚠️ Limited contest and submission data

## Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
4. Add environment variables in Render dashboard
5. Deploy!

## Rate Limiting

The API includes rate limiting to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## Caching

Built-in caching reduces external API calls:
- User data: 5 minutes
- Contest data: 10 minutes
- Configurable TTL

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `404`: User/resource not found
- `429`: Rate limit exceeded
- `500`: Server error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
=======
# Codeit-Api
CodeIt API is a RESTful API that fetches and aggregates competitive programming data from platforms like Codeforces, CodeChef, and LeetCode, making it easy to integrate coding profiles into applications.
>>>>>>> 1d1175e3ff47d0e9cb3fbb495ffcdb9567123274

