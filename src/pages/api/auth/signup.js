
import { Shov } from 'shov-js';
import bcrypt from 'bcryptjs';

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
    // --- Retry Logic for checking existing user ---
    let existingUserResults;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Signup API] Checking for existing user... (Attempt ${attempts})`);
        existingUserResults = await shov.search('user', { 
          collection: 'users', 
          filters: { email },
          limit: 1
        });
        console.log(`[Signup API] Attempt ${attempts} successful.`);
        break; // Success, exit loop
      } catch (error) {
        console.error(`[Signup API] Attempt ${attempts} to check user failed:`, error.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to check for existing user after ${maxAttempts} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    // --- End Retry Logic ---

    const existingUser = existingUserResults?.items?.[0]?.value;

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      hashedPassword,
      username: email.split('@')[0], // Simple username from email
      xp: 0,
      streak: 0,
      completed_lessons: [],
      mistakes: [],
      preferences: ['greetings', 'dining'],
      created_at: new Date().toISOString(),
    };

    await shov.add('users', newUser);

    res.status(201).json({ message: 'User registered successfully.', userId: newUser.id });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
