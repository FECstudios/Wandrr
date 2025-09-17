import { Shov } from 'shov-js';

export default async function handler(req, res) {
  console.log('=== SUBMIT API ENDPOINT HIT (CORRECTED) ===');
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { user, lesson, answer } = req.body;
  const userId = user?.id;

  if (!userId || !lesson || !lesson.shovId || answer === undefined) {
    return res.status(400).json({ message: 'Missing required fields: user object, lesson object, answer' });
  }

  const shov = new Shov({
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY,
  });

  try {
    let userShovId;
    try {
      const userSearchResults = await shov.search('user', { 
        collection: 'users', 
        filters: { id: userId },
        limit: 1
      });
      userShovId = userSearchResults?.items?.[0]?.id;
      if (!userShovId) {
        throw new Error('User not found in database, cannot get Shov ID.');
      }
    } catch (error) {
        console.error('Failed to retrieve user Shov ID:', error.message);
        return res.status(500).json({ message: 'Could not retrieve user database ID.', error: error.message });
    }

    const isCorrect = String(lesson.answer) === String(answer);
    let updatedUser = { ...user };
    const lessonIdForTracking = lesson.shovId;

    if (isCorrect) {
      updatedUser.xp = (user.xp || 0) + (lesson.xp || 10);
      updatedUser.streak = (user.streak || 0) + 1;
      updatedUser.completed_lessons = [...(user.completed_lessons || []), lessonIdForTracking];
    } else {
      updatedUser.streak = 0;
      updatedUser.mistakes = [...(user.mistakes || []), { lessonId: lessonIdForTracking, submittedAnswer: answer }];
    }

    console.log(`Updating user ${userShovId} with new data:`, updatedUser);
    
    // CORRECTED: Use the shov.update() method as per the documentation.
    await shov.update('users', userShovId, updatedUser);
    
    console.log('User updated successfully in Shov.');

    const responseData = { correct: isCorrect, correctAnswer: lesson.answer, updatedUser: updatedUser };
    res.status(200).json(responseData);

  } catch (error) {
    console.error('=== ERROR IN SUBMIT API ===');
    console.error('Error submitting lesson:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}