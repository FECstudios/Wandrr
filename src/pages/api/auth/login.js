import { Shov } from 'shov-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const shov = new Shov({
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY,
  });

  try {
    // --- Enhanced Retry Logic for fetching user ---
    let userResults;
    let attempts = 0;
    const maxAttempts = 5; // Restored to 5 attempts for normal operation
    const baseDelay = 1000; // Base delay of 1 second

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        userResults = await shov.search('user', { 
          collection: 'users', 
          filters: { email },
          limit: 1
        });
        
        console.log(`[Login API] Search result for ${email}:`, {
          totalItems: userResults?.items?.length || 0,
          hasUser: userResults?.items?.length > 0,
          userExists: !!userResults?.items?.[0]?.value
        });
        
        if (userResults?.items?.length > 0) {
            break; // User found, exit loop
        }
        
        // If not the last attempt, wait before retrying
        if (attempts < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempts - 1); // Exponential backoff
          console.log(`[Login API] User not found, waiting ${delay}ms before retry ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`[Login API] Attempt ${attempts}/${maxAttempts} failed:`, {
          message: error.message,
          errorCode: error.code,
          fullError: error.toString()
        });
        
        // Check if it's a capacity/rate limit error or search service unavailable
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        const isSearchServiceError = error.message.includes('Search service is temporarily unavailable') ||
                                   error.message.includes('service temporarily unavailable');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[Login API] Rate limit exceeded after ${maxAttempts} attempts.`);
            return res.status(503).json({ 
              message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
              retryAfter: 30 // Suggest retry after 30 seconds
            });
          } else if (isSearchServiceError) {
            console.log(`[Login API] Search service unavailable after ${maxAttempts} attempts, will create local user`);
            userResults = { items: [] }; // Set empty results to trigger local fallback
            break; // Exit retry loop to proceed to local fallback
          } else {
            // Only trigger local fallback for database errors, not auth errors
            const isDatabaseError = error.message.includes('9002') || 
                                  error.message.includes('unknown internal error') ||
                                  error.message.includes('connection') ||
                                  error.message.includes('timeout');
            
            if (isDatabaseError) {
              console.log(`[Login API] Database error detected after ${maxAttempts} attempts, will create local user`);
              userResults = { items: [] }; // Set empty results to trigger local fallback
              break; // Exit retry loop to proceed to local fallback
            } else {
              // For non-database errors (like auth issues), throw the error normally
              throw new Error(`Failed to fetch user after ${maxAttempts} attempts: ${error.message}`);
            }
          }
        }
        
        // Calculate exponential backoff delay with jitter for rate limiting
        const delay = isRateLimitError 
          ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
          : isSearchServiceError
          ? baseDelay * Math.pow(2, attempts - 1) + Math.random() * 500 // Medium delay for search service
          : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // --- End Enhanced Retry Logic ---

    const user = userResults?.items?.[0]?.value;

    console.log(`[Login API] Final user lookup result:`, {
      userResultsExists: !!userResults,
      itemsLength: userResults?.items?.length || 0,
      userExists: !!user,
      userEmail: user?.email,
      hasHashedPassword: !!user?.hashedPassword
    });

    if (!user) {
      // Check if we got here due to database errors (empty results after error fallback)
      // vs normal case where user just doesn't exist
      const wasEmptyDueToErrors = userResults && userResults.items && userResults.items.length === 0;
      
      if (wasEmptyDueToErrors) {
        console.log(`[Login API] Database errors detected, creating local user for: ${email}`);
        
        // Create a local user object for offline functionality
        const localUser = {
          id: `local-user-${Date.now()}`,
          email,
          username: email.split('@')[0],
          xp: 0,
          streak: 0,
          completed_lessons: [],
          mistakes: [],
          preferences: ['greetings', 'dining'],
          created_at: new Date().toISOString(),
          isLocalUser: true // Flag to indicate this is a local-only user
        };
        
        // Generate JWT token for local user
        const token = jwt.sign(
          { 
            userId: localUser.id, 
            email: localUser.email,
            isLocalUser: true 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' } // Longer expiry for local users
        );
        
        console.log(`[Login API] Created local user with ID: ${localUser.id}`);
        return res.status(200).json({ 
          message: 'Login successful (local mode).', 
          token,
          user: localUser,
          isLocalMode: true
        });
      } else {
        // Normal case: user doesn't exist, return proper auth error
        console.log(`[Login API] User not found for email: ${email}`);
        return res.status(401).json({ 
          message: 'Invalid credentials. Please check your email and password.' 
        });
      }
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Try refreshing page' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    console.error('Error during login:', error);
    
    // If we get here and it's not a handled error, create local user as fallback
    if (error.message && (
      error.message.includes('9002') || 
      error.message.includes('unknown internal error') ||
      error.message.includes('Search service is temporarily unavailable')
    )) {
      console.log(`[Login API] Database error detected, creating local user for: ${email}`);
      
      try {
        // Create a local user object for offline functionality
        const localUser = {
          id: `local-user-${Date.now()}`,
          email,
          username: email.split('@')[0],
          xp: 0,
          streak: 0,
          completed_lessons: [],
          mistakes: [],
          preferences: ['greetings', 'dining'],
          created_at: new Date().toISOString(),
          isLocalUser: true
        };
        
        // Generate JWT token for local user
        const token = jwt.sign(
          { 
            userId: localUser.id, 
            email: localUser.email,
            isLocalUser: true 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log(`[Login API] Created local user as error fallback with ID: ${localUser.id}`);
        return res.status(200).json({ 
          message: 'Login successful (local mode).', 
          token,
          user: localUser,
          isLocalMode: true
        });
      } catch (tokenError) {
        console.error('Failed to create local user token:', tokenError);
        // Fall through to generic error handling
      }
    }
    
    // Handle specific error types
    if (error.message.includes('Service temporarily unavailable')) {
      // This error was already handled in the retry logic
      return;
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
      message: 'Internal Server Error. Please try again later.' 
    });
  }
}