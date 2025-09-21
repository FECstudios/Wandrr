import { Shov } from 'shov-js';

export default async function handler(req, res) {
  console.log('=== SUBMIT API ENDPOINT HIT ===');
  console.log('Request body structure:', {
    hasUser: !!req.body?.user,
    hasLesson: !!req.body?.lesson,
    hasAnswer: req.body?.answer !== undefined,
    userShovId: req.body?.user?.shovId,
    lessonShovId: req.body?.lesson?.shovId
  });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { user, question, submittedAnswer, isCorrect } = req.body; // New parameters
  const userId = user?.id;
  const userShovId = user?.shovId; // Try to get cached Shov ID first

  if (!userId || !question || submittedAnswer === undefined || isCorrect === undefined) { // Updated validation
    const missingFields = [];
    if (!userId) missingFields.push('user.id');
    if (!question) missingFields.push('question object');
    if (submittedAnswer === undefined) missingFields.push('submittedAnswer');
    if (isCorrect === undefined) missingFields.push('isCorrect');
    
    console.error('Validation failed. Missing fields:', missingFields);
    return res.status(400).json({ 
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  const shov = new Shov({
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY,
  });

  try {
    let finalUserShovId = userShovId;
    
    // Only fetch Shov ID if not already cached in user object
    if (!finalUserShovId) {
      console.log(`[Submit API] Shov ID not cached, fetching for user ${userId}...`);
      
      // --- Enhanced Retry Logic for fetching user Shov ID (FALLBACK ONLY) ---
      let attempts = 0;
      const maxAttempts = 5;
      const baseDelay = 1000;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`[Submit API] Fetching user Shov ID... (Attempt ${attempts}/${maxAttempts})`);
          
          const userSearchResults = await shov.where('users', { 
            filter: { id: userId },
            limit: 1
          });
          
          finalUserShovId = userSearchResults?.items?.[0]?.id;
          if (!finalUserShovId) {
            throw new Error('User not found in database, cannot get Shov ID.');
          }
          
          console.log(`[Submit API] Attempt ${attempts} successful, user Shov ID found: ${finalUserShovId}`);
          break; // Success, exit loop
          
        } catch (error) {
          console.error(`[Submit API] Attempt ${attempts} to fetch user failed:`, error.message);
          
          // Check if it's a capacity/rate limit error
          const isRateLimitError = error.message.includes('Capacity temporarily exceeded') || 
                                 error.message.includes('rate limit') ||
                                 error.message.includes('3040');
          
          if (attempts >= maxAttempts) {
            if (isRateLimitError) {
              console.error(`[Submit API] Rate limit exceeded after ${maxAttempts} attempts. Service temporarily unavailable.`);
              return res.status(503).json({ 
                message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
                retryAfter: 30
              });
            } else {
              console.error('Failed to retrieve user Shov ID:', error.message);
              return res.status(500).json({ 
                message: 'Could not retrieve user database ID.', 
                error: error.message 
              });
            }
          }
          
          // Calculate exponential backoff delay with jitter for rate limiting
          const delay = isRateLimitError 
            ? baseDelay * Math.pow(3, attempts - 1) + Math.random() * 1000 // Longer delay for rate limits
            : baseDelay * Math.pow(2, attempts - 1); // Standard exponential backoff
          
          console.log(`[Submit API] Waiting ${Math.round(delay)}ms before retry attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      // --- End Enhanced Retry Logic ---
    } else {
      console.log(`[Submit API] Using cached Shov ID: ${finalUserShovId}`);
    }

    let updatedUser = { ...user };
    
    // Handle temporary shovIds by using the question's own ID for tracking
    // Assuming question.id is unique enough for tracking individual questions
    const questionIdForTracking = question.id; // Use question.id for tracking

    console.log('Using question ID for tracking:', questionIdForTracking);

    if (isCorrect) {
      updatedUser.xp = (user.xp || 0) + (question.xp || 10); // Use question.xp
      updatedUser.streak = (user.streak || 0) + 1;
      // We should track completed questions, not lessons, if XP is per question
      updatedUser.completed_questions = [...(user.completed_questions || []), questionIdForTracking];
    } else {
      updatedUser.streak = 0;
      updatedUser.mistakes = [...(user.mistakes || []), { questionId: questionIdForTracking, submittedAnswer: submittedAnswer }];
    }

    console.log(`Updating user ${finalUserShovId} with new data:`, updatedUser);
    
    // CORRECTED: Use the shov.update() method as per the documentation.
    await shov.update('users', finalUserShovId, updatedUser);
    
    console.log('User updated successfully in Shov.');

    // Return updated user with cached Shov ID for future requests
    const responseData = { 
      correct: isCorrect, 
      correctAnswer: question.answer, // Use question.answer
      updatedUser: { ...updatedUser, shovId: finalUserShovId } // Cache Shov ID
    };
    res.status(200).json(responseData);

  } catch (error) {
    console.error('=== ERROR IN SUBMIT API ===');
    console.error('Error submitting question:', error.message); // Changed message
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}