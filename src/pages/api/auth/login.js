import { Shov } from 'shov-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    // --- Retry Logic for fetching user ---
    let userResults;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Login API] Fetching user from Shov... (Attempt ${attempts})`);
        userResults = await shov.search('user', { 
          collection: 'users', 
          filters: { email },
          limit: 1
        });
        
        if (userResults?.items?.length > 0) {
            console.log(`[Login API] Attempt ${attempts} successful, user found.`);
            break; // User found, exit loop
        }
        
        console.log(`[Login API] Attempt ${attempts}, user not found yet. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait before retrying

      } catch (error) {
        console.error(`[Login API] Attempt ${attempts} to fetch user failed:`, error.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to fetch user after ${maxAttempts} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    // --- End Retry Logic ---

    const user = userResults?.items?.[0]?.value;

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Try refresing page' });
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Try refresing page' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}