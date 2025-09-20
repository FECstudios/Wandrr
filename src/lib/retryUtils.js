/**
 * Enhanced retry utility for handling Shov API calls with intelligent backoff
 * Specifically designed to handle rate limiting and capacity exceeded errors
 */

/**
 * Executes a function with retry logic and exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 5)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {string} options.operationName - Name for logging purposes (default: 'Operation')
 * @param {Function} options.onError - Optional callback for error handling
 * @returns {Promise} - Result of successful operation
 */
export async function retryWithBackoff(operation, options = {}) {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    operationName = 'Operation',
    onError = null
  } = options;

  let attempts = 0;
  let lastError;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`[${operationName}] Executing... (Attempt ${attempts}/${maxAttempts})`);
      
      const result = await operation();
      
      console.log(`[${operationName}] Attempt ${attempts} successful.`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`[${operationName}] Attempt ${attempts} failed:`, error.message);
      
      // Check if it's a capacity/rate limit error
      const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                             error.message.includes('rate limit') ||
                             error.message.includes('3040');
      
      if (attempts >= maxAttempts) {
        if (isRateLimitError) {
          console.error(`[${operationName}] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
          const rateLimitError = new Error('RATE_LIMIT_EXCEEDED');
          rateLimitError.originalError = error;
          throw rateLimitError;
        } else {
          throw new Error(`Failed ${operationName.toLowerCase()} after ${maxAttempts} attempts: ${error.message}`);
        }
      }
      
      // Calculate exponential backoff delay with jitter for rate limiting
      const delay = isRateLimitError 
        ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
        : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
      
      console.log(`[${operationName}] Waiting ${Math.round(delay)}ms before retry attempt...`);
      
      // Call onError callback if provided
      if (onError && typeof onError === 'function') {
        onError(error, attempts, maxAttempts);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Standard error handler for API responses
 * @param {Object} res - Express response object
 * @param {Error} error - The error to handle
 * @param {string} context - Context for logging (e.g., 'Login API')
 */
export function handleApiError(res, error, context = 'API') {
  console.error(`Error in ${context}:`, error);
  
  // Handle specific error types
  if (error.message === 'RATE_LIMIT_EXCEEDED') {
    return res.status(503).json({ 
      message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
      retryAfter: 30
    });
  }
  
  if (error.message.includes('Capacity temporarily exceeded') || 
      error.message.includes('rate limit') ||
      error.message.includes('3040')) {
    return res.status(503).json({ 
      message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
      retryAfter: 30
    });
  }
  
  // Generic server error
  res.status(500).json({ 
    message: 'Internal Server Error. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
}

/**
 * Wrapper for Shov search operations with built-in retry logic
 * @param {Object} shov - Shov instance
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} operationName - Name for logging
 * @returns {Promise} - Search results
 */
export async function retrySearch(shov, query, options, operationName = 'Shov Search') {
  return retryWithBackoff(
    () => shov.search(query, options),
    { operationName }
  );
}