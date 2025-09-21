// API endpoint to handle local lesson submissions
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, question, submittedAnswer, isCorrect } = req.body; // New parameters

  // Validate required fields
  if (!userId || !question || submittedAnswer === undefined || isCorrect === undefined) { // Updated validation
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!question) missingFields.push('question object');
    if (submittedAnswer === undefined) missingFields.push('submittedAnswer');
    if (isCorrect === undefined) missingFields.push('isCorrect');
    return res.status(400).json({ 
      message: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }

  // Check if this is a local user
  if (!userId.startsWith('local-user-')) {
    return res.status(400).json({ message: 'This endpoint is only for local users' });
  }

  try {
    // Calculate XP based on correctness
    const xpGained = isCorrect ? (question.xp || 10) : 0; // Use question.xp, 0 for incorrect answers
    
    // For local users, we just return success and let the client handle storage
    const response = {
      message: isCorrect ? 'Correct! Well done!' : 'Not quite right, but keep learning!',
      xpGained,
      newTotalXp: xpGained, // Client will calculate actual total
      isCorrect,
      localMode: true,
      timestamp: new Date().toISOString()
    };

    // Add level up information if applicable
    if (isCorrect) {
      response.levelUp = false; // Client will determine this based on local data
    }

    console.log(`[Local Submit API] Processed question submission for local user: ${userId}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in local lesson submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}