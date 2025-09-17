import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const { userId } = req.query;

  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    // --- Retry Logic for fetching user ---
    let userSearchResults;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[user API] Fetching user from Shov... (Attempt ${attempts})`);
        userSearchResults = await shov.search('user', { 
          collection: 'users', 
          filters: { id: userId },
          limit: 1
        });
        console.log(`[user API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
      } catch (error) {
        console.error(`[user API] Attempt ${attempts} to fetch user failed:`, error.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to fetch user after ${maxAttempts} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 750));
      }
    }
    // --- End Retry Logic ---

    const user = userSearchResults?.items?.[0]?.value;

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: `User with id ${userId} not found.` });
    }
  } catch (error) {
    console.error('Error fetching user from Shov:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}