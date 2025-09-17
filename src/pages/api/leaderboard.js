import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    // Using shov.search to get all users
    const userResults = await shov.search('all users', { collection: 'users' });
    const users = userResults?.items?.map(item => item.value) || [];

    const sortedUsers = users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    res.status(200).json(sortedUsers.slice(0, 10)); // Return top 10

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}