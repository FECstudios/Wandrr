/**
 * User caching utilities to reduce redundant API calls
 * Implements client-side caching for user data including Shov IDs
 * SSR-safe implementation with local user support
 */

import { isClient } from './clientStorage';
import { getLocalUser, storeLocalUser, isLocalUser } from './localUserStorage';

// In-memory cache for user data (client-side only)
let userCache;
if (isClient()) {
  userCache = new Map();
} else {
  userCache = {
    get: () => null,
    set: () => {},
    delete: () => {},
    clear: () => {},
    size: 0,
    entries: () => []
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache key generator for consistent cache keys
 * @param {string} userId - User ID
 * @param {string} type - Cache type ('user', 'shovId', etc.)
 * @returns {string} Cache key
 */
function getCacheKey(userId, type = 'user') {
  return `${type}:${userId}`;
}

/**
 * Check if cached data is still valid
 * @param {Object} cacheEntry - Cache entry with timestamp
 * @returns {boolean} True if cache is valid
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

/**
 * Get user data from cache
 * @param {string} userId - User ID
 * @returns {Object|null} Cached user data or null
 */
export function getCachedUser(userId) {
  const cacheKey = getCacheKey(userId);
  const cached = userCache.get(cacheKey);
  
  if (isCacheValid(cached)) {
    console.log(`[Cache] Using cached user data for ${userId}`);
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    userCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache user data
 * @param {string} userId - User ID
 * @param {Object} userData - User data to cache
 */
export function setCachedUser(userId, userData) {
  const cacheKey = getCacheKey(userId);
  userCache.set(cacheKey, {
    data: userData,
    timestamp: Date.now()
  });
  console.log(`[Cache] Cached user data for ${userId}`);
}

/**
 * Get Shov ID from cache
 * @param {string} userId - User ID
 * @returns {string|null} Cached Shov ID or null
 */
export function getCachedShovId(userId) {
  const cacheKey = getCacheKey(userId, 'shovId');
  const cached = userCache.get(cacheKey);
  
  if (isCacheValid(cached)) {
    console.log(`[Cache] Using cached Shov ID for ${userId}`);
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    userCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache Shov ID
 * @param {string} userId - User ID
 * @param {string} shovId - Shov ID to cache
 */
export function setCachedShovId(userId, shovId) {
  const cacheKey = getCacheKey(userId, 'shovId');
  userCache.set(cacheKey, {
    data: shovId,
    timestamp: Date.now()
  });
  console.log(`[Cache] Cached Shov ID for ${userId}: ${shovId}`);
}

/**
 * Clear cache for a specific user
 * @param {string} userId - User ID
 */
export function clearUserCache(userId) {
  const userKey = getCacheKey(userId, 'user');
  const shovKey = getCacheKey(userId, 'shovId');
  
  userCache.delete(userKey);
  userCache.delete(shovKey);
  
  console.log(`[Cache] Cleared cache for user ${userId}`);
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  userCache.clear();
  console.log('[Cache] Cleared all cache entries');
}

/**
 * Get cache statistics for debugging
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const total = userCache.size;
  let valid = 0;
  let expired = 0;
  
  for (const [key, value] of userCache.entries()) {
    if (isCacheValid(value)) {
      valid++;
    } else {
      expired++;
    }
  }
  
  return {
    total,
    valid,
    expired,
    hitRate: total > 0 ? (valid / total * 100).toFixed(1) + '%' : '0%'
  };
}

/**
 * Enhanced user fetch with caching and local user support
 * @param {string} userId - User ID
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} User data with Shov ID
 */
export async function fetchUserWithCache(userId, useCache = true) {
  // Handle local users
  if (isLocalUser(userId)) {
    console.log(`[Cache] Fetching local user: ${userId}`);
    let localUserData = getLocalUser(userId);
    
    if (!localUserData) {
      // Create default local user data
      localUserData = {
        id: userId,
        username: 'Local User',
        xp: 0,
        streak: 0,
        completed_lessons: [],
        mistakes: [],
        preferences: ['greetings', 'dining'],
        created_at: new Date().toISOString(),
        isLocalUser: true
      };
      storeLocalUser(localUserData);
    }
    
    return localUserData;
  }
  
  // Check cache first for remote users
  if (useCache) {
    const cached = getCachedUser(userId);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const response = await fetch(`/api/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    
    const userData = await response.json();
    
    // Cache the result
    if (useCache) {
      setCachedUser(userId, userData);
    }
    
    return userData;
  } catch (error) {
    console.error(`[Cache] Failed to fetch user ${userId}:`, error.message);
    throw error;
  }
}

// Auto-cleanup expired cache entries every 5 minutes
if (isClient()) {
  setInterval(() => {
    const stats = getCacheStats();
    if (stats.expired > 0) {
      console.log(`[Cache] Cleaning up ${stats.expired} expired entries`);
      
      // Remove expired entries
      for (const [key, value] of userCache.entries()) {
        if (!isCacheValid(value)) {
          userCache.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}