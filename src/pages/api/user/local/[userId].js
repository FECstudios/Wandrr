// API endpoint to handle local user operations
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.query;

  // Check if this is a local user request
  if (!userId || !userId.startsWith('local-user-')) {
    return res.status(400).json({ message: 'Invalid local user ID' });
  }

  try {
    // For local users, return a default user structure that the client will populate
    const localUser = {
      id: userId,
      username: 'Local User',
      xp: 0,
      streak: 0,
      completed_lessons: [],
      mistakes: [],
      preferences: ['greetings', 'dining'],
      created_at: new Date().toISOString(),
      isLocalUser: true,
      note: 'This user operates in local mode. Data is stored in browser.'
    };

    console.log(`[Local User API] Returning local user structure for: ${userId}`);
    res.status(200).json(localUser);

  } catch (error) {
    console.error('Error in local user endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}