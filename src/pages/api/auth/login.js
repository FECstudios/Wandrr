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
    const maxAttempts = 5; // Increased max attempts
    const baseDelay = 1000; // Base delay of 1 second

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Login API] Fetching user from Shov... (Attempt ${attempts}/${maxAttempts})`);
        
        userResults = await shov.search('user', { 
          collection: 'users', 
          filters: { email },
          limit: 1
        });
        
        if (userResults?.items?.length > 0) {
            console.log(`[Login API] Attempt ${attempts} successful, user found.`);
            break; // User found, exit loop
        }
        
        console.log(`[Login API] Attempt ${attempts}, user not found yet. Retrying...`);
        
        // If not the last attempt, wait before retrying
        if (attempts < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempts - 1); // Exponential backoff
          console.log(`[Login API] Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`[Login API] Attempt ${attempts} to fetch user failed:`, error.message);
        
        // Check if it's a capacity/rate limit error
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[Login API] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
            return res.status(503).json({ 
              message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
              retryAfter: 30 // Suggest retry after 30 seconds
            });
          } else {
            throw new Error(`Failed to fetch user after ${maxAttempts} attempts: ${error.message}`);
          }
        }
        
        // Calculate exponential backoff delay with jitter for rate limiting
        const delay = isRateLimitError 
          ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
          : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
        
        console.log(`[Login API] Waiting ${Math.round(delay)}ms before retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // --- End Enhanced Retry Logic ---

    const user = userResults?.items?.[0]?.value;

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Try refreshing page' });
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