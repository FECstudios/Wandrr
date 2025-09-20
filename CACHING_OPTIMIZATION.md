# User Data Caching Optimization

## Problem Identified
The application was making redundant API calls to fetch user Shov IDs on every lesson submission, causing unnecessary latency and increased load on the Shov service. From the logs, we can see:

```
[Submit API] Fetching user Shov ID... (Attempt 1/5)
[Submit API] Attempt 1 to fetch user failed: An unexpected server error occurred: 9002: unknown internal error
[Submit API] Waiting 1000ms before retry attempt...
[Submit API] Fetching user Shov ID... (Attempt 2/5)
[Submit API] Attempt 2 successful, user Shov ID found.
```

This happened **every time** a user submitted an answer, even though the Shov ID doesn't change.

## Solution Implemented

### 1. **Shov ID Caching in API Responses**
- **Modified `/api/user/[userId].js`**: Now includes `shovId` in the user object returned to the client
- **Modified `/api/lesson/submit.js`**: Uses cached `shovId` from user object, only fetches if missing
- **Modified `/api/lesson/today/[userId].js`**: Caches Shov ID when creating new users

### 2. **Client-Side User Cache System**
Created `/src/lib/userCache.js` with comprehensive caching utilities:

#### Core Functions:
- `getCachedUser(userId)` - Retrieve cached user data
- `setCachedUser(userId, userData)` - Cache user data
- `fetchUserWithCache(userId)` - Enhanced fetch with automatic caching
- `clearUserCache(userId)` - Clear cache for specific user
- Cache expires after 5 minutes automatically

#### Features:
- **Time-based expiration**: Cache entries expire after 5 minutes
- **Automatic cleanup**: Expired entries are removed periodically
- **Cache statistics**: Monitor hit rates and performance
- **Smart fallbacks**: Gracefully handles cache misses

### 3. **Optimized API Flow**

#### Before Optimization:
```
1. User submits answer
2. Submit API searches Shov for user by ID (NEW SEARCH EVERY TIME)
3. Extract Shov ID from search results
4. Update user in Shov using Shov ID
```

#### After Optimization:
```
1. User submits answer (user object includes cached shovId)
2. Submit API uses cached Shov ID directly
3. Update user in Shov using cached Shov ID
4. Only searches if Shov ID is missing (fallback)
```

## Performance Improvements

### Reduced API Calls
- **Before**: 2 API calls per lesson submission (search + update)
- **After**: 1 API call per lesson submission (update only)
- **Reduction**: 50% fewer API calls to Shov service

### Faster Response Times
- **Eliminated**: Network latency for user search
- **Eliminated**: Retry delays from rate limiting on search
- **Improved**: User experience with faster lesson submissions

### Better Resilience
- **Cached data**: Survives temporary service disruptions
- **Fallback mechanism**: Still works if cache is missing
- **Reduced load**: Less pressure on external services

## Implementation Details

### 1. Submit API Changes
```javascript
// Before: Always fetch Shov ID
const userSearchResults = await shov.search('user', { 
  collection: 'users', 
  filters: { id: userId },
  limit: 1
});

// After: Use cached Shov ID, fallback if needed
let finalUserShovId = userShovId; // From cached user object
if (!finalUserShovId) {
  // Only search if not cached
  const userSearchResults = await shov.search(/*...*/);
  finalUserShovId = userSearchResults?.items?.[0]?.id;
}
```

### 2. User API Changes
```javascript
// Before: Return user data only
res.status(200).json(user);

// After: Include Shov ID for caching
const userWithShovId = { ...user, shovId: userShovId };
res.status(200).json(userWithShovId);
```

### 3. Frontend Integration
```javascript
// Before: Direct API calls
const userRes = await fetch(`/api/user/${userId}`);

// After: Cached fetch with smart fallbacks
const userData = await fetchUserWithCache(userId, true);
```

## Cache Management

### Automatic Expiration
- Cache entries expire after 5 minutes
- Prevents stale data issues
- Balances performance with data freshness

### Manual Cache Control
- `clearUserCache(userId)` - Clear specific user cache
- `clearAllCache()` - Clear all cached data
- Integrated with logout functionality

### Memory Management
- Automatic cleanup of expired entries
- Prevents memory leaks
- Monitoring tools for cache performance

## Monitoring and Debugging

### Logging Enhancements
```javascript
// Cache hit
console.log(`[Cache] Using cached user data for ${userId}`);

// Cache miss
console.log(`[Submit API] Shov ID not cached, fetching for user ${userId}...`);

// Cache update
console.log(`[Cache] Cached user data for ${userId}`);
```

### Cache Statistics
```javascript
const stats = getCacheStats();
// Returns: { total: 5, valid: 3, expired: 2, hitRate: '60%' }
```

## Benefits Achieved

### 1. **Performance**
- 50% reduction in API calls
- Faster lesson submission responses
- Reduced network latency

### 2. **User Experience**
- Smoother interactions
- Fewer loading delays
- Better reliability during high traffic

### 3. **System Reliability**
- Reduced load on Shov service
- Lower chance of rate limiting
- Better error resilience

### 4. **Cost Optimization**
- Fewer external API calls
- Reduced bandwidth usage
- Lower service costs

## Future Enhancements

### Potential Improvements
1. **Persistent caching**: Use localStorage for cache persistence across sessions
2. **Selective cache invalidation**: Smart cache updates on specific data changes
3. **Cache preloading**: Proactive caching of likely-needed data
4. **Cache compression**: Reduce memory footprint for large user objects
5. **Cache analytics**: Detailed performance metrics and optimization insights

### Monitoring Considerations
- Track cache hit rates
- Monitor memory usage
- Alert on cache performance degradation
- Log cache-related errors for debugging

This optimization significantly reduces the redundant API calls you identified, making the application more efficient and responsive while maintaining data consistency and reliability.