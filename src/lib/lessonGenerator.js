import query from './huggingface.js';
import { Shov } from 'shov-js';

export async function generateLesson(country, topic, difficulty = 1, userMistakes = []) {
  const lessonTypes = ['multiple_choice', 'true_false'];
  const type = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
  
  const systemPrompt = "You are a helpful assistant designed to output JSON.";

  const userPrompt = `Generate a JSON lesson for a travel customs app called Wandrr.\n\nRequirements:\n- Country: ${country}\n- Topic: ${topic} \n- Difficulty: ${difficulty} (1=beginner, 3=expert)\n- Type: ${type}\n\nCreate a practical lesson about cultural customs or etiquette in ${country}.\n\nYour response MUST be a valid JSON object, and ONLY the JSON object. Do NOT include any other text, explanations, or markdown formatting outside the JSON.\n\nJSON Structure Example (for multiple_choice):\n{\n  "type": "multiple_choice",\n  "country": "Japan",\n  "topic": "Greetings",\n  "question": "What is a common greeting in Japan?",\n  "options": ["Hello", "Goodbye", "Thank you", "Excuse me"],\n  "answer": "Hello",\n  "explanation": "Konnichiwa is a common greeting.",\n  "xp": 10\n}\n\nJSON Structure Example (for true_false):\n{\n  "type": "true_false",\n  "country": "Japan",\n  "topic": "Dining Etiquette",\n  "question": "It is polite to slurp your noodles in Japan.",\n  "answer": "true",\n  "explanation": "Slurping noodles is considered a sign of enjoyment.",\n  "xp": 10\n}\n\nFocus on real scenarios travelers encounter. Ensure the 'type' field in your JSON matches the requested type: ${type}.`;

  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    const response = await query({
      model: "meta-llama/Llama-3.2-3B-Instruct:hyperbolic",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const content = response.choices[0].message?.content?.trim();
    let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
    const lesson = JSON.parse(cleanedContent);
    
    const lessonWithId = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level: difficulty,
      created_at: new Date().toISOString(),
      ...lesson
    };

    console.log('Lesson object to be added to Shov:', lessonWithId);
    const addResult = await shov.add('lessons', lessonWithId);
    console.log('Shov add result:', addResult);
    console.log('Lesson successfully added to Shov.');

    // Store Shov's internal ID for reliable retrieval
    const shovAssignedId = addResult?.id; 
    if (shovAssignedId) {
      lessonWithId.shovId = shovAssignedId;
    }

    return lessonWithId;
    
  } catch (error) {
    console.error('AI generation failed:', error);
    
    // Fallback lesson
    const fallback = {
      id: `lesson-${Date.now()}-fallback`,
      type: 'multiple_choice',
      country,
      topic,
      question: `What is appropriate when ${topic.toLowerCase()} in ${country}?`,
      options: ['Be respectful', 'Follow local customs', 'Ask locals', 'Observe first'],
      answer: 'Be respectful',
      explanation: 'Respect is universal in all cultures.',
      xp: 10,
      level: difficulty,
      created_at: new Date().toISOString()
    };
    
    console.log('Fallback lesson object to be added to Shov:', fallback);
    const addResult = await shov.add('lessons', fallback);
    console.log('Shov add result:', addResult);
    console.log('Fallback lesson successfully added to Shov.');

    const shovAssignedId = addResult?.id; 
    if (shovAssignedId) {
      fallback.shovId = shovAssignedId;
    }
    return fallback;
  }
}

export function getPersonalizedParams(user) {
  const lessonPairs = [
    { country: 'Japan', topic: 'Greetings' },
    { country: 'Japan', topic: 'Traditional Foods' },
    { country: 'United States', topic: 'Traditional Foods' },
    { country: 'France', topic: 'Traditional Foods' },
    { country: 'France', topic: 'Social Norms' },
    { country: 'Italy', topic: 'Dining Etiquette' },
    { country: 'Spain', topic: 'Festivals' },
    { country: 'Thailand', topic: 'Shopping' },
    { country: 'Mexico', topic: 'Local Phrases' },
    { country: 'Germany', topic: 'Transportation' },
    { country: 'South Korea', topic: 'Business Customs' },
    { country: 'Brazil', topic: 'Art & Music' },
    { country: 'India', topic: 'Cultural Taboos' },
    { country: 'Egypt', topic: 'Historical Sites' },
  ];
  
  const completedCount = user?.completed_lessons?.length || 0;
  const difficulty = Math.min(Math.floor((user?.xp || 0) / 50) + 1, 3);
  
  // Cycle through the predefined lesson pairs
  const lessonParams = lessonPairs[completedCount % lessonPairs.length];

  return {
    ...lessonParams,
    difficulty
  };
}