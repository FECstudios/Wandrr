import query from './huggingface.js';
import { Shov } from 'shov-js';

export async function generateLesson(country, topic, difficulty = 1, userMistakes = []) {
  const lessonTypes = ['multiple_choice', 'true_false'];
  const type = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
  
  // Enhanced system prompt for better AI behavior
  const systemPrompt = `You are a world-class cultural expert and educational content creator specialized in travel etiquette and customs. Your expertise spans global cultures, traditions, and social norms. You create engaging, practical lessons that help travelers navigate cultural differences respectfully and confidently.

You ALWAYS respond with valid JSON only - no explanations, no markdown, no extra text.`;

  // Generate context-aware prompts based on user mistakes
  const mistakeContext = userMistakes && userMistakes.length > 0 
    ? `\n\nUser has made mistakes on these topics: ${userMistakes.map(m => m.lessonId || 'unknown').join(', ')}. Consider reinforcing related concepts.`
    : '';

  // Dynamic difficulty descriptions
  const difficultyGuide = {
    1: "BEGINNER: Basic, essential knowledge every traveler should know. Simple, clear scenarios.",
    2: "INTERMEDIATE: More nuanced cultural insights. Situations requiring cultural awareness.", 
    3: "ADVANCED: Complex cultural subtleties, business contexts, and sophisticated social situations."
  };

  const userPrompt = `Create an exceptional cultural lesson for travelers visiting ${country}, focusing on ${topic}.

📋 REQUIREMENTS:
- Country: ${country}
- Topic: ${topic}
- Difficulty: ${difficulty}/3 (${difficultyGuide[difficulty]})
- Format: ${type}
- Target: International travelers seeking authentic cultural understanding${mistakeContext}

🎯 QUALITY STANDARDS:
✅ Questions must be PRACTICAL and scenario-based
✅ Use REAL situations travelers actually encounter
✅ Include specific cultural context and reasoning
✅ Make explanations educational and memorable
✅ Ensure cultural accuracy and sensitivity
✅ Create engaging, story-driven questions

📚 QUESTION GUIDELINES:
${type === 'multiple_choice' ? `
• Craft 4 realistic options that could genuinely confuse travelers
• Include 1 correct answer and 3 plausible but wrong choices
• Make distractors educational (common misconceptions)
• Avoid obvious wrong answers` : `
• Create statements that test genuine cultural understanding
• Address common traveler misconceptions
• Include nuanced cultural truths that surprise people`}

🌟 ENGAGEMENT TECHNIQUES:
- Start questions with scenario contexts ("You're at a dinner party...", "When meeting a business partner...")
- Use specific examples rather than generic statements
- Include helpful cultural insights in explanations
- Reference local customs, traditions, or social expectations

🎨 EXAMPLES BY DIFFICULTY:

BEGINNER Example:
{
  "type": "multiple_choice",
  "country": "Japan",
  "topic": "Greetings",
  "question": "You're meeting your Japanese colleague's parents for the first time at their home. What's the most respectful way to greet them?",
  "options": ["Bow deeply and say 'Hajimemashite'", "Offer a firm handshake and maintain eye contact", "Give a casual wave and say 'Hello'", "Hug them warmly to show friendliness"],
  "answer": "Bow deeply and say 'Hajimemashite'",
  "explanation": "In Japanese culture, a deep bow (around 30 degrees) with 'Hajimemashite' (nice to meet you) shows proper respect, especially to elders. Physical contact like handshakes or hugs can make people uncomfortable in formal introductions.",
  "xp": 10
}

INTERMEDIATE Example:
{
  "type": "true_false",
  "country": "France",
  "topic": "Dining Etiquette",
  "question": "At a French dinner party, it's considered polite to finish everything on your plate to show appreciation for the meal.",
  "answer": "false",
  "explanation": "In France, leaving a small amount of food on your plate actually signals that you've been well-fed and satisfied. Completely cleaning your plate might suggest the host didn't provide enough food, which could be embarrassing for them.",
  "xp": 10
}

ADVANCED Example:
{
  "type": "multiple_choice",
  "country": "South Korea",
  "topic": "Business Customs",
  "question": "During a business dinner in Seoul, your Korean client offers you a drink. The culturally appropriate response is to:",
  "options": ["Accept with both hands and wait for them to pour", "Accept with one hand and pour it yourself", "Politely decline to maintain professionalism", "Accept and immediately reciprocate by pouring theirs"],
  "answer": "Accept with both hands and wait for them to pour",
  "explanation": "In Korean business culture, receiving drinks with both hands shows respect and humility. You should never pour your own drink - wait for your client or a colleague to pour it. This ritual builds trust and demonstrates understanding of Korean hierarchy and respect customs.",
  "xp": 10
}

⚡ OUTPUT FORMAT:
Respond with ONLY the JSON object. No markdown, no explanations, no extra text.

JSON Structure for ${type}:
${type === 'multiple_choice' ? `{
  "type": "multiple_choice",
  "country": "${country}",
  "topic": "${topic}",
  "question": "[Scenario-based question with specific context]",
  "options": ["[Correct answer]", "[Plausible wrong answer 1]", "[Plausible wrong answer 2]", "[Plausible wrong answer 3]"],
  "answer": "[Correct answer - must match one option exactly]",
  "explanation": "[Detailed cultural context explaining why this is correct and what travelers should understand]",
  "xp": 10
}` : `{
  "type": "true_false",
  "country": "${country}",
  "topic": "${topic}",
  "question": "[Specific cultural statement that tests genuine understanding]",
  "answer": "true" or "false",
  "explanation": "[Clear explanation of the cultural reality and practical implications for travelers]",
  "xp": 10
}`}

Create your lesson now:`;


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
    
    // Enhanced fallback lesson with better engagement
    const fallbackScenarios = {
      'Greetings': {
        question: `You've just arrived in ${country} and meet your host family for the first time. What's the most respectful way to greet them?`,
        options: ['Follow their lead and mirror their greeting style', 'Give everyone a firm handshake', 'Bow formally to show respect', 'Wave and say hello in English'],
        answer: 'Follow their lead and mirror their greeting style',
        explanation: `When unsure about local greeting customs in ${country}, the safest approach is to observe and follow your host's lead. This shows cultural sensitivity and respect for local traditions.`
      },
      'Dining Etiquette': {
        question: `At a traditional meal in ${country}, you're unsure about the proper etiquette. What should you do?`,
        options: ['Observe others and follow their lead', 'Eat the way you do at home', 'Ask loudly what the rules are', 'Leave the food untouched'],
        answer: 'Observe others and follow their lead',
        explanation: `Dining etiquette varies greatly between cultures. In ${country}, watching and mimicking your hosts shows respect and helps you learn proper customs naturally.`
      },
      'default': {
        question: `When experiencing ${topic.toLowerCase()} in ${country}, what's the most important principle to follow?`,
        options: ['Show respect and cultural sensitivity', 'Do exactly what you do at home', 'Avoid participating entirely', 'Make jokes to break the ice'],
        answer: 'Show respect and cultural sensitivity',
        explanation: `Universal respect and cultural sensitivity are key when navigating ${topic.toLowerCase()} in ${country}. Being observant, respectful, and open to learning will serve you well in any cultural situation.`
      }
    };

    const scenario = fallbackScenarios[topic] || fallbackScenarios['default'];
    
    const fallback = {
      id: `lesson-${Date.now()}-fallback`,
      type: 'multiple_choice',
      country,
      topic,
      question: scenario.question,
      options: scenario.options,
      answer: scenario.answer,
      explanation: scenario.explanation,
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
  // Expanded lesson pairs with more diverse and engaging topics
  const lessonPairs = [
    // Asian Countries - Rich cultural diversity
    { country: 'Japan', topic: 'Greetings & Respect' },
    { country: 'Japan', topic: 'Dining Etiquette' },
    { country: 'Japan', topic: 'Gift Giving' },
    { country: 'South Korea', topic: 'Business Customs' },
    { country: 'South Korea', topic: 'Age & Hierarchy' },
    { country: 'Thailand', topic: 'Temple Etiquette' },
    { country: 'Thailand', topic: 'Royal Family Respect' },
    { country: 'China', topic: 'Face & Honor' },
    { country: 'India', topic: 'Religious Customs' },
    { country: 'India', topic: 'Food Traditions' },
    
    // European Countries - Sophisticated social norms  
    { country: 'France', topic: 'Dining Etiquette' },
    { country: 'France', topic: 'Social Conversation' },
    { country: 'Germany', topic: 'Punctuality & Planning' },
    { country: 'Germany', topic: 'Privacy & Directness' },
    { country: 'Italy', topic: 'Family & Community' },
    { country: 'Italy', topic: 'Fashion & Appearance' },
    { country: 'Spain', topic: 'Festivals & Celebrations' },
    { country: 'Netherlands', topic: 'Cycling Culture' },
    { country: 'United Kingdom', topic: 'Pub Culture' },
    { country: 'United Kingdom', topic: 'Queue Etiquette' },
    
    // Middle Eastern & African Countries
    { country: 'Morocco', topic: 'Bargaining & Markets' },
    { country: 'Egypt', topic: 'Historical Sites' },
    { country: 'UAE', topic: 'Islamic Customs' },
    { country: 'Turkey', topic: 'Hospitality Customs' },
    { country: 'South Africa', topic: 'Cultural Diversity' },
    
    // Americas - Diverse cultural expressions
    { country: 'United States', topic: 'Tipping Culture' },
    { country: 'United States', topic: 'Personal Space' },
    { country: 'Mexico', topic: 'Family Traditions' },
    { country: 'Mexico', topic: 'Celebration Customs' },
    { country: 'Brazil', topic: 'Social Warmth' },
    { country: 'Brazil', topic: 'Beach Culture' },
    { country: 'Argentina', topic: 'Dining Schedules' },
    { country: 'Canada', topic: 'Politeness Culture' },
    
    // Oceania & Unique Cultures
    { country: 'Australia', topic: 'Casual Communication' },
    { country: 'New Zealand', topic: 'Māori Culture' },
    
    // Northern European Specifics
    { country: 'Sweden', topic: 'Work-Life Balance' },
    { country: 'Norway', topic: 'Nature & Outdoor Life' },
    { country: 'Denmark', topic: 'Hygge & Comfort' },
    
    // Eastern European Insights
    { country: 'Russia', topic: 'Formal Interactions' },
    { country: 'Poland', topic: 'Catholic Traditions' },
    
    // Additional Asian Perspectives
    { country: 'Indonesia', topic: 'Island Customs' },
    { country: 'Philippines', topic: 'Respect for Elders' },
    { country: 'Vietnam', topic: 'Street Food Culture' },
    
    // Advanced Cultural Concepts
    { country: 'Switzerland', topic: 'Precision & Quality' },
    { country: 'Belgium', topic: 'Multilingual Etiquette' },
    { country: 'Portugal', topic: 'Maritime Heritage' },
    { country: 'Greece', topic: 'Ancient & Modern Balance' },
    { country: 'Israel', topic: 'Religious Diversity' },
    { country: 'Kenya', topic: 'Ubuntu Philosophy' },
    { country: 'Peru', topic: 'Indigenous Wisdom' },
    { country: 'Colombia', topic: 'Coffee Culture' }
  ];
  
  const completedCount = user?.completed_lessons?.length || 0;
  const difficulty = Math.min(Math.floor((user?.xp || 0) / 50) + 1, 3);
  
  // Cycle through the expanded lesson pairs
  const lessonParams = lessonPairs[completedCount % lessonPairs.length];

  return {
    ...lessonParams,
    difficulty
  };
}