import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const { userId } = req.query;

  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    // --- Enhanced Retry Logic for fetching user ---
    let userSearchResults;
    let attempts = 0;
    const maxAttempts = 5; // Increased max attempts
    const baseDelay = 1000; // Base delay of 1 second

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[user API] Fetching user from Shov... (Attempt ${attempts}/${maxAttempts})`);
        
        userSearchResults = await shov.where('users', { 
          filter: { id: userId },
          limit: 1
        });
        
        console.log(`[user API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
        
      } catch (error) {
        console.error(`[user API] Attempt ${attempts} to fetch user failed:`, error.message);
        
        // Check if it's a capacity/rate limit error
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[user API] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
            return res.status(503).json({ 
              message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
              retryAfter: 30
            });
          } else {
            throw new Error(`Failed to fetch user after ${maxAttempts} attempts: ${error.message}`);
          }
        }
        
        // Calculate exponential backoff delay with jitter for rate limiting
        const delay = isRateLimitError 
          ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
        
        console.log(`[user API] Waiting ${Math.round(delay)}ms before retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // --- End Enhanced Retry Logic ---

    const userItem = userSearchResults?.items?.[0];
    const user = userItem?.value;
    const userShovId = userItem?.id;

    if (user) {
      // Cache the Shov ID in the user object for future API calls
      const userWithShovId = { ...user, shovId: userShovId };
      res.status(200).json(userWithShovId);
    } else {
      res.status(404).json({ message: `User with id ${userId} not found.` });
    }
  } catch (error) {
    console.error('Error fetching user from Shov:', error);
    
    // Handle specific error types
    if (error.message.includes('Capacity temporarily exceeded') || 
        error.message.includes('rate limit') ||
        error.message.includes('3040')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
}