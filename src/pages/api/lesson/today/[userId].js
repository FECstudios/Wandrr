import { generateLesson, getPersonalizedParams } from '../../../../lib/lessonGenerator';
import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const { userId } = req.query;

  const shov = new Shov({
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY
  });

  try {
    // --- Enhanced Retry Logic for fetching user ---
    let userResults;
    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 1000;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Today's Lesson API] Fetching user from Shov... (Attempt ${attempts}/${maxAttempts})`);
        
        // Using shov.where with filter on the 'id' field within the value object
        userResults = await shov.where('users', {
          filter: { id: userId },
          limit: 1
        });
        
        console.log(`[Today's Lesson API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
        
      } catch (error) {
        console.error(`[Today's Lesson API] Attempt ${attempts} to fetch user failed:`, error.message);
        
        // Check if it's a capacity/rate limit error
        const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                               error.message.includes('rate limit') ||
                               error.message.includes('3040');
        
        if (attempts >= maxAttempts) {
          if (isRateLimitError) {
            console.error(`[Today's Lesson API] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
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
        
        console.log(`[Today's Lesson API] Waiting ${Math.round(delay)}ms before retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const userItem = userResults?.items?.[0];
    const user = userItem?.value; // Extract the 'value' property
    const userShovId = userItem?.id; // Extract the Shov ID

    if (!user) {
      // If no user, create one to start the journey
      const newUser = {
        id: userId,
        username: 'NewWandrr',
        xp: 0,
        streak: 0,
        completed_lessons: [],
        mistakes: [],
        preferences: ['greetings', 'dining']
      };
      const addResult = await shov.add('users', newUser);
      const newUserShovId = addResult?.id;
      
      const lessonParams = getPersonalizedParams(newUser);
      const lesson = await generateLesson(lessonParams.country, lessonParams.topic, lessonParams.difficulty);
      return res.status(200).json(lesson);
    }

    const lessonParams = getPersonalizedParams(user);
    const lesson = await generateLesson(lessonParams.country, lessonParams.topic, lessonParams.difficulty, user.mistakes);

    res.status(200).json(lesson);

  } catch (error) {
    console.error('Error in today\'s lesson endpoint:', error);
    
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