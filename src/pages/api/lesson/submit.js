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

  const { user, lesson, answer } = req.body;
  const userId = user?.id;
  const userShovId = user?.shovId; // Try to get cached Shov ID first

  if (!userId || !lesson || !lesson.shovId || answer === undefined) {
    const missingFields = [];
    if (!userId) missingFields.push('user.id');
    if (!lesson) missingFields.push('lesson object');
    else if (!lesson.shovId) missingFields.push('lesson.shovId');
    if (answer === undefined) missingFields.push('answer');
    
    console.error('Validation failed. Missing fields:', missingFields);
    return res.status(400).json({ 
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }
  
  console.log('Validation passed. Processing submission...');

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
          
          const userSearchResults = await shov.search('user', { 
            collection: 'users', 
            filters: { id: userId },
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

    const isCorrect = String(lesson.answer) === String(answer);
    let updatedUser = { ...user };
    
    // Handle temporary shovIds by using the lesson's own ID for tracking
    const lessonIdForTracking = lesson.shovId?.startsWith('temp-') || lesson.shovId?.startsWith('emergency-') 
      ? lesson.id 
      : lesson.shovId;
    
    console.log('Using lesson ID for tracking:', lessonIdForTracking);
    console.log('Lesson shovId type:', lesson.shovId?.startsWith('temp-') ? 'temporary' : lesson.shovId?.startsWith('emergency-') ? 'emergency' : 'normal');

    if (isCorrect) {
      updatedUser.xp = (user.xp || 0) + (lesson.xp || 10);
      updatedUser.streak = (user.streak || 0) + 1;
      updatedUser.completed_lessons = [...(user.completed_lessons || []), lessonIdForTracking];
    } else {
      updatedUser.streak = 0;
      updatedUser.mistakes = [...(user.mistakes || []), { lessonId: lessonIdForTracking, submittedAnswer: answer }];
    }

    console.log(`Updating user ${finalUserShovId} with new data:`, updatedUser);
    
    // CORRECTED: Use the shov.update() method as per the documentation.
    await shov.update('users', finalUserShovId, updatedUser);
    
    console.log('User updated successfully in Shov.');

    // Return updated user with cached Shov ID for future requests
    const responseData = { 
      correct: isCorrect, 
      correctAnswer: lesson.answer, 
      updatedUser: { ...updatedUser, shovId: finalUserShovId } // Cache Shov ID
    };
    res.status(200).json(responseData);

  } catch (error) {
    console.error('=== ERROR IN SUBMIT API ===');
    console.error('Error submitting lesson:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}