// API endpoint to handle local lesson operations
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
    // Generate a simple lesson for local users
    const localLessons = [
      {
        id: `local-lesson-${Date.now()}`,
        country: "Japan",
        topic: "greetings",
        question: "What is the traditional bow called in Japanese culture?",
        type: "multiple_choice",
        options: ["Ojigi", "Rei", "Keirei", "Eshaku"],
        answer: "Ojigi",
        explanation: "Ojigi (お辞儀) is the general term for bowing in Japanese culture, an important part of greetings and showing respect.",
        xp: 15,
        difficulty: "beginner",
        isLocal: true
      },
      {
        id: `local-lesson-${Date.now() + 1}`,
        country: "Italy",
        topic: "dining",
        question: "In Italy, it's common to drink cappuccino after dinner.",
        type: "true_false",
        options: ["true", "false"],
        answer: "false",
        explanation: "In Italy, cappuccino is typically enjoyed only in the morning. Drinking it after dinner is considered unusual.",
        xp: 15,
        difficulty: "beginner",
        isLocal: true
      },
      {
        id: `local-lesson-${Date.now() + 2}`,
        country: "Germany",
        topic: "social",
        question: "What is the appropriate greeting in a German business setting?",
        type: "multiple_choice",
        options: ["Hallo", "Guten Tag", "Hey", "Servus"],
        answer: "Guten Tag",
        explanation: "Guten Tag is the most formal and appropriate greeting for German business settings.",
        xp: 15,
        difficulty: "beginner",
        isLocal: true
      },
      {
        id: `local-lesson-${Date.now() + 3}`,
        country: "Brazil",
        topic: "greetings",
        question: "Personal space in Brazilian culture is typically smaller than in North American culture.",
        type: "true_false",
        options: ["true", "false"],
        answer: "true",
        explanation: "Brazilians generally stand closer and have more physical contact during conversations compared to North Americans.",
        xp: 15,
        difficulty: "beginner",
        isLocal: true
      }
    ];

    // Return a random lesson
    const randomLesson = localLessons[Math.floor(Math.random() * localLessons.length)];
    
    console.log(`[Local Lesson API] Generated lesson for local user: ${userId}`);
    res.status(200).json(randomLesson);

  } catch (error) {
    console.error('Error in local lesson endpoint:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}