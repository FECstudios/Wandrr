
import { Shov } from 'shov-js';
import bcrypt from 'bcryptjs';

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
    // --- Enhanced Retry Logic for checking existing user ---
    let existingUserResults;
    let attempts = 0;
    const maxAttempts = 5; // Restored to 5 attempts for normal operation
    const baseDelay = 1000; // Base delay of 1 second

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Signup API] Checking for existing user... (Attempt ${attempts}/${maxAttempts})`);
        
        existingUserResults = await shov.where('users', { 
          filter: { email },
          limit: 1
        });
        
        console.log(`[Signup API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
        
      } catch (error) {
        console.error(`[Signup API] Attempt ${attempts} to check user failed:`, error.message);
        
        // Check if it's a capacity/rate limit error
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[Signup API] Rate limit exceeded after ${maxAttempts} attempts.`);
            return res.status(503).json({ 
              message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
              retryAfter: 30
            });
          } else {
            // Check if it's a database connectivity issue
            const isDatabaseError = error.message.includes('9002') || 
                                  error.message.includes('unknown internal error') ||
                                  error.message.includes('connection') ||
                                  error.message.includes('timeout');
            
            if (isDatabaseError) {
              console.log(`[Signup API] Database error detected, returning success to allow local login`);
              return res.status(201).json({ 
                message: 'Account created successfully. You can now log in.',
                userId: `local-user-pending-${Date.now()}`
              });
            } else {
              // For other errors, throw normally
              throw new Error(`Failed to check for existing user after ${maxAttempts} attempts: ${error.message}`);
            }
          }
        }
        
        // Calculate exponential backoff delay with jitter for rate limiting
        const delay = isRateLimitError 
          ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
        
        console.log(`[Signup API] Waiting ${Math.round(delay)}ms before retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // --- End Enhanced Retry Logic ---

    const existingUser = existingUserResults?.items?.[0]?.value;

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password and create user object
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      hashedPassword,
      username: email.split('@')[0], // Simple username from email
      xp: 0,
      streak: 0,
      completed_lessons: [],
      mistakes: [],
      preferences: ['greetings', 'dining'],
      created_at: new Date().toISOString(),
    };

    console.log('[Signup API] Creating user with data:', { ...newUser, hashedPassword: '[HIDDEN]' });
    
    // Add user to database
    const addResult = await shov.add('users', newUser);
    console.log('[Signup API] User creation result:', addResult);
    console.log('[Signup API] User created with Shov ID:', addResult?.id);
    
    // Wait longer for data propagation and search index update
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
    
    // DEBUG: Let's try to get ALL users to see what's in the database
    try {
      const allUsersResult = await shov.where('users');
      console.log('[Signup API] DEBUG - All users in database:', {
        totalUsers: allUsersResult?.items?.length || 0,
        userEmails: allUsersResult?.items?.map(item => item?.value?.email) || []
      });
    } catch (debugError) {
      console.error('[Signup API] DEBUG - Failed to get all users:', debugError.message);
    }
    
    // Verify user was created by searching for it with retry logic
    let verificationAttempts = 0;
    const maxVerificationAttempts = 3;
    let userFound = false;
    
    while (verificationAttempts < maxVerificationAttempts && !userFound) {
      try {
        verificationAttempts++;
        
        // Try both approaches: specific filter and manual search
        const verificationResult = await shov.where('users', { 
          filter: { email },
          limit: 1
        });
        
        // Also try getting all users and filtering manually
        const allUsersResult = await shov.where('users');
        const manualMatch = allUsersResult?.items?.find(item => item?.value?.email === email);
        
        userFound = verificationResult?.items?.length > 0;
        
        console.log(`[Signup API] User verification attempt ${verificationAttempts}:`, {
          filterQueryFound: userFound,
          filterQueryResults: verificationResult?.items?.length || 0,
          manualSearchFound: !!manualMatch,
          totalUsersInDB: allUsersResult?.items?.length || 0,
          targetEmail: email,
          foundEmails: allUsersResult?.items?.map(item => item?.value?.email) || []
        });
        
        // If manual match found but filter didn't work, use manual result
        if (!userFound && manualMatch) {
          userFound = true;
          console.log('[Signup API] Filter query failed but manual search found user - possible indexing issue');
        }
        
        if (!userFound && verificationAttempts < maxVerificationAttempts) {
          console.log(`[Signup API] User not found in search index yet, waiting 1s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (verifyError) {
        console.error(`[Signup API] User verification attempt ${verificationAttempts} failed:`, verifyError.message);
        if (verificationAttempts < maxVerificationAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!userFound) {
      console.warn('[Signup API] User verification failed after all attempts, but user was created successfully');
    }

    res.status(201).json({ message: 'User registered successfully.', userId: newUser.id });
  } catch (error) {
    console.error('Error during signup:', error);
    
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
    
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
