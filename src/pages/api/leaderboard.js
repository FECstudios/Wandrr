import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    // --- Enhanced Retry Logic for fetching leaderboard ---
    let userResults;
    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 1000;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Leaderboard API] Fetching users from Shov... (Attempt ${attempts}/${maxAttempts})`);
        
        // Using shov.search to get all users
        userResults = await shov.search('all users', { collection: 'users' });
        
        console.log(`[Leaderboard API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
        
      } catch (error) {
        console.error(`[Leaderboard API] Attempt ${attempts} to fetch users failed:`, error.message);
        
        // Check if it's a capacity/rate limit error
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[Leaderboard API] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
            return res.status(503).json({ 
              message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
              retryAfter: 30
            });
          } else {
            throw new Error(`Failed to fetch leaderboard after ${maxAttempts} attempts: ${error.message}`);
          }
        }
        
        // Calculate exponential backoff delay with jitter for rate limiting
        const delay = isRateLimitError 
          ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
        
        console.log(`[Leaderboard API] Waiting ${Math.round(delay)}ms before retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const users = userResults?.items?.map(item => item.value) || [];

    const sortedUsers = users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    res.status(200).json(sortedUsers.slice(0, 10)); // Return top 10

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
    // Handle specific error types
    if (error.message.includes('Capacity temporarily exceeded') || 
        error.message.includes('rate limit') ||
        error.message.includes('3040')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({ message: 'Internal Server Error' });
  }
}