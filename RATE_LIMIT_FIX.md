# Login API Rate Limiting Fix

## Problem
The login API was failing with "Capacity temporarily exceeded" errors after 3 retry attempts, causing complete login failures for users during high traffic periods. The error code 3040 indicates rate limiting from the Shov service.

## Root Cause
1. **Insufficient retry attempts**: Only 3 attempts before giving up
2. **Uniform delays**: Fixed 800ms delays didn't account for rate limiting
3. **Poor error handling**: Rate limit errors were treated as permanent failures
4. **No exponential backoff**: Linear retry pattern wasn't suitable for rate limiting

## Solution Implemented

### 1. Enhanced Retry Logic
- **Increased attempts**: From 3 to 5 attempts for better resilience
- **Exponential backoff**: Delays increase exponentially (1s, 2s, 4s, 8s, 16s)
- **Rate limit detection**: Special handling for capacity/rate limit errors
- **Jitter for rate limits**: Random delay component to prevent thundering herd

### 2. Improved Error Responses
- **503 Service Unavailable**: Proper HTTP status for rate limiting
- **Retry-After header**: Suggests when to retry (30 seconds)
- **User-friendly messages**: Clear explanation of temporary unavailability

### 3. Applied to All APIs
Updated the following endpoints with the same improvements:
- `/api/auth/login.js` - User authentication
- `/api/auth/signup.js` - User registration  
- `/api/user/[userId].js` - User profile retrieval
- `/api/leaderboard.js` - Leaderboard data
- `/api/lesson/submit.js` - Lesson submission
- `/api/lesson/today/[userId].js` - Daily lesson generation

### 4. Retry Utility Library
Created `/src/lib/retryUtils.js` with:
- `retryWithBackoff()` - Centralized retry logic
- `handleApiError()` - Standardized error handling
- `retrySearch()` - Shov-specific retry wrapper

## Key Improvements

### Before:
```javascript
// Fixed 3 attempts, uniform delay
let attempts = 0;
const maxAttempts = 3;
while (attempts < maxAttempts) {
  try {
    // operation
    break;
  } catch (error) {
    if (attempts >= maxAttempts) {
      throw new Error(`Failed after ${maxAttempts} attempts`);
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}
```

### After:
```javascript
// 5 attempts, intelligent backoff, rate limit handling
let attempts = 0;
const maxAttempts = 5;
const baseDelay = 1000;

while (attempts < maxAttempts) {
  try {
    // operation
    break;
  } catch (error) {
    const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                           error.message.includes('3040');
    
    if (attempts >= maxAttempts) {
      if (isRateLimitError) {
        return res.status(503).json({ 
          message: 'Service temporarily unavailable',
          retryAfter: 30 
        });
      }
    }
    
    const delay = isRateLimitError 
      ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000
      : baseDelay * Math.pow(2, attempts - 1);
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

## Benefits
1. **Better user experience**: Graceful degradation instead of hard failures
2. **Higher success rate**: More attempts with smarter timing
3. **Rate limit compliance**: Respects service capacity constraints
4. **Consistent behavior**: All APIs handle rate limiting uniformly
5. **Maintainable code**: Centralized retry utilities

## Monitoring
The enhanced logging provides detailed information about:
- Attempt numbers and timing
- Specific error types encountered
- Rate limit detection
- Retry delays calculated

## Next Steps
Consider implementing:
1. **Circuit breaker pattern** for extended outages
2. **Request queuing** during high traffic
3. **Caching** to reduce API calls
4. **Load balancing** across multiple Shov instances