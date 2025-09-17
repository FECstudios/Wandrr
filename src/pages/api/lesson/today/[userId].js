import { generateLesson, getPersonalizedParams } from '../../../../lib/lessonGenerator';
import { Shov } from 'shov-js';

export default async function handler(req, res) {
  const { userId } = req.query;

  const shov = new Shov({
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY
  });

  try {
    // Using shov.search with filter on the 'id' field within the value object
    const userResults = await shov.search('user', {
      collection: 'users',
      filters: { id: userId },
      limit: 1
    });
    const user = userResults?.items?.[0]?.value; // Extract the 'value' property

    if (!user) {
      // If no user, create one to start the journey
      const newUser = {
        id: userId,
        username: 'NewWandrr',
        xp: 0,
        streak: 0,
        completed_lessons: [],
        mistakes: [],
        preferences: ['greetings', 'dining']
      };
      await shov.add('users', newUser);
      const lessonParams = getPersonalizedParams(newUser);
      const lesson = await generateLesson(lessonParams.country, lessonParams.topic, lessonParams.difficulty);
      return res.status(200).json(lesson);
    }

    const lessonParams = getPersonalizedParams(user);
    const lesson = await generateLesson(lessonParams.country, lessonParams.topic, lessonParams.difficulty, user.mistakes);

    res.status(200).json(lesson);

  } catch (error) {
    console.error('Error in today\'s lesson endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}