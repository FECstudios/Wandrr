// API endpoint to handle local lesson submissions
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { lessonId, userId, answer, isCorrect } = req.body;

  // Validate required fields
  if (!lessonId || !userId || answer === undefined || isCorrect === undefined) {
    return res.status(400).json({ 
      message: 'Missing required fields: lessonId, userId, answer, isCorrect' 
    });
  }

  // Check if this is a local user
  if (!userId.startsWith('local-user-')) {
    return res.status(400).json({ message: 'This endpoint is only for local users' });
  }

  try {
    // Calculate XP based on correctness
    const xpGained = isCorrect ? 15 : 5; // Give some XP even for wrong answers
    
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

    console.log(`[Local Submit API] Processed lesson submission for local user: ${userId}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error in local lesson submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}