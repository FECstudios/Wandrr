import query from './huggingface.js';
import { Shov } from 'shov-js';

export async function generateLesson(country, topic, difficulty = 1, userMistakes = []) {
  // Add timestamp-based randomization to ensure unique lessons
  const randomSeed = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  
  // Enhanced system prompt for better AI behavior
  const systemPrompt = `You are a world-class cultural expert and educational content creator specialized in travel etiquette and customs. Your expertise spans global cultures, traditions, and social norms. You create engaging, practical lessons that help travelers navigate cultural differences respectfully and confidently.

RANDOM SEED: ${randomSeed} (use this to ensure unique content generation)

You ALWAYS respond with valid JSON only - no explanations, no markdown, no extra text.`;

  // Generate context-aware prompts based on user mistakes
  const mistakeContext = userMistakes && userMistakes.length > 0 
    ? `\n\nUser has made mistakes on these topics: ${userMistakes.map(m => m.lessonId || 'unknown').join(', ')}. Consider reinforcing related concepts.`
    : '';

  // Add scenario variety to keep content fresh
  const scenarioStarters = [
    "You're visiting a local family...",
    "At a business meeting...",
    "During a festival celebration...",
    "While dining at a restaurant...",
    "When shopping at a market...",
    "At a religious site...",
    "Meeting new friends...",
    "In a professional setting...",
    "During a cultural ceremony...",
    "While using public transportation..."
  ];
  
  const randomScenario = scenarioStarters[Math.floor(Math.random() * scenarioStarters.length)];
  
  console.log('[AI Generation] Creating lesson with parameters:', {
    country,
    topic,
    difficulty,
    randomSeed,
    selectedScenario: randomScenario
  });

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
- Format: A mix of multiple_choice and true_false questions.
- Scenario Context: ${randomScenario}
- Random Seed: ${randomSeed} (ensure unique content)
- Target: International travelers seeking authentic cultural understanding${mistakeContext}
- Number of questions: 3-5 (vary the number slightly for natural feel)

🎯 QUALITY STANDARDS:
✅ Questions must be PRACTICAL and scenario-based
✅ Use REAL situations travelers actually encounter
✅ Include specific cultural context and reasoning
✅ Make explanations educational and memorable
✅ Ensure cultural accuracy and sensitivity
✅ Create engaging, story-driven questions
✅ CRITICAL: Generate UNIQUE, SPECIFIC answer options - avoid generic responses
✅ Each answer option must be contextually relevant to the specific country and topic
✅ Avoid repetitive patterns in answer choices across different lessons
✅ Each question should be distinct and cover different aspects of the topic.
✅ Ensure the correct answer is logically sound and directly addresses the question.
✅ For multiple-choice questions, craft 4 realistic options that could genuinely confuse travelers. Include 1 correct answer and 3 plausible but wrong choices. Make distractors educational (common misconceptions) and avoid obvious wrong answers.
✅ For true/false questions, create statements that test genuine cultural understanding, address common traveler misconceptions, and include nuanced cultural truths that surprise people.

🌟 ENGAGEMENT TECHNIQUES:
- Start questions with scenario contexts ("You're at a dinner party...", "When meeting a business partner...")
- Use specific examples rather than generic statements
- Include helpful cultural insights in explanations
- Reference local customs, traditions, or social expectations


🎨 EXAMPLES BY DIFFICULTY:

BEGINNER Example:
{
  "country": "Japan",
  "topic": "Greetings",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "You're meeting your Japanese colleague's parents for the first time at their home. What's the most respectful way to greet them?",
      "options": ["Bow deeply and say 'Hajimemashite'", "Offer a firm handshake and maintain eye contact", "Give a casual wave and say 'Hello'", "Hug them warmly to show friendliness"],
      "answer": "Bow deeply and say 'Hajimemashite'",
      "explanation": "In Japanese culture, a deep bow (around 30 degrees) with 'Hajimemashite' (nice to meet you) shows proper respect, especially to elders. Physical contact like handshakes or hugs can make people uncomfortable in formal introductions.",
      "xp": 10
    },
    {
      "type": "true_false",
      "question": "It is common to maintain direct eye contact during a formal greeting in Japan to show sincerity.",
      "answer": "false",
      "explanation": "While direct eye contact is valued in many Western cultures, in Japan, prolonged direct eye contact during formal greetings can be seen as aggressive or disrespectful. A slight downward gaze is often more appropriate.",
      "xp": 10
    }
  ]
}

INTERMEDIATE Example (Religious Customs in India):
{
  "country": "India",
  "topic": "Religious Customs",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "You're visiting a Hindu temple in Delhi. Before entering the main prayer hall, what should you do?",
      "options": ["Remove your shoes and wash your hands and feet", "Keep your shoes on but cover your head", "Simply bow once and enter directly", "Wait for a priest to personally invite you in"],
      "answer": "Remove your shoes and wash your hands and feet",
      "explanation": "In Hindu temples, removing shoes shows respect for the sacred space, and washing hands/feet is a purification ritual. Most temples have designated areas for this cleansing before entering the prayer hall.",
      "xp": 10
    },
    {
      "type": "true_false",
      "question": "It is generally acceptable to wear revealing clothing when visiting a Hindu temple in India.",
      "answer": "false",
      "explanation": "Modest dress is essential when visiting religious sites in India. Shoulders and knees should be covered, and tight or revealing clothing is considered inappropriate and disrespectful.",
      "xp": 10
    }
  ]
}

INTERMEDIATE Example:
{
  "country": "France",
  "topic": "Dining Etiquette",
  "questions": [
    {
      "type": "true_false",
      "question": "At a French dinner party, it's considered polite to finish everything on your plate to show appreciation for the meal.",
      "answer": "false",
      "explanation": "In France, leaving a small amount of food on your plate actually signals that you've been well-fed and satisfied. Completely cleaning your plate might suggest the host didn't provide enough food, which could be embarrassing for them.",
      "xp": 10
    },
    {
      "type": "multiple_choice",
      "question": "When dining in France, where should you typically keep your hands when not eating?",
      "options": ["On your lap", "Under the table", "Resting on the table, wrists visible", "Anywhere comfortable"],
      "answer": "Resting on the table, wrists visible",
      "explanation": "In French dining etiquette, it's considered polite to keep your hands (wrists visible) on the table, not in your lap. This shows you have nothing to hide and are engaged in the meal.",
      "xp": 10
    }
  ]
}

ADVANCED Example:
{
  "country": "South Korea",
  "topic": "Business Customs",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "During a business dinner in Seoul, your Korean client offers you a drink. The culturally appropriate response is to:",
      "options": ["Accept with both hands and wait for them to pour", "Accept with one hand and pour it yourself", "Politely decline to maintain professionalism", "Accept and immediately reciprocate by pouring theirs"],
      "answer": "Accept with both hands and wait for them to pour",
      "explanation": "In Korean business culture, receiving drinks with both hands shows respect and humility. You should never pour your own drink - wait for your client or a colleague to pour it. This ritual builds trust and demonstrates understanding of Korean hierarchy and respect customs.",
      "xp": 10
    },
    {
      "type": "true_false",
      "question": "When exchanging business cards (myeongham) in South Korea, it is acceptable to write notes on the card immediately after receiving it.",
      "answer": "false",
      "explanation": "Writing on a business card immediately after receiving it is considered disrespectful in South Korea, as it implies you are not valuing the person it represents. It's best to review it carefully, then place it respectfully on the table or in a card holder.",
      "xp": 10
    }
  ]
}

⚡ OUTPUT FORMAT:
Respond with ONLY the JSON object. No markdown, no explanations, no extra text.

JSON Structure for a lesson with multiple questions:
{
  "country": "${country}",
  "topic": "${topic}",
  "questions": [
    {
      "type": "multiple_choice" or "true_false",
      "question": "[Scenario-based question with specific context]",
      "options": ["", "", "", ""], // Only for multiple_choice. Omit for true_false.
      "answer": "[Correct answer - must match one option exactly or 'true'/'false']",
      "explanation": "[Detailed cultural context explaining why this is correct and what travelers should understand]",
      "xp": 10
    }
    // ... up to 5 question objects, with a mix of types
  ]
}

Create your lesson now:`;


  const shov = new Shov({ 
    projectName: process.env.SHOV_PROJECT,
    apiKey: process.env.SHOV_API_KEY 
  });

  try {
    console.log('[AI Generation] Attempting to generate lesson with Hugging Face...');
    const response = await query({
      model: "meta-llama/Llama-3.2-3B-Instruct:hyperbolic",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    console.log('[AI Generation] Raw response received:', {
      hasResponse: !!response,
      hasChoices: !!response?.choices,
      choicesLength: response?.choices?.length || 0,
      firstChoice: response?.choices?.[0],
      errorInResponse: response?.error
    });

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('No content in AI response: ' + JSON.stringify(response));
    }

    const content = response.choices[0].message?.content?.trim();
    console.log('[AI Generation] Content received:', {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + '...'
    });
    
    let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    // Fix common JSON formatting issues from AI
    if (!cleanedContent.endsWith('}')) {
      console.log('[AI Generation] JSON appears incomplete, attempting to fix...');
      cleanedContent += '\n}';
    }
    
    // Remove any trailing commas that might cause parsing issues
    cleanedContent = cleanedContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    
    console.log('[AI Generation] Cleaned content:', {
      cleanedLength: cleanedContent?.length || 0,
      cleanedPreview: cleanedContent?.substring(0, 200) + '...'
    });
    
    const parsedLesson = JSON.parse(cleanedContent);

    const newLessonId = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Generate lesson ID here

    // Calculate total XP for the lesson based on individual questions
    let totalXp = 0;
    if (parsedLesson.questions && Array.isArray(parsedLesson.questions)) {
      parsedLesson.questions.forEach((q, index) => {
        q.id = `${newLessonId}-q${index}`; // Assign a unique ID to each question
        q.xp = q.xp || 10; // Ensure each question has an XP, default to 10
        totalXp += q.xp;
      });
    } else {
      // Fallback if for some reason questions array is not present or malformed
      totalXp = 10; // Default XP for a single-question lesson
      parsedLesson.questions = [{ 
        ...parsedLesson, 
        id: `${newLessonId}-q0`, // Assign ID to fallback single question
        xp: 10 
      }]; // Wrap existing lesson as a single question
    }

    const lessonWithId = {
      id: newLessonId, // Use the generated lesson ID
      level: difficulty,
      created_at: new Date().toISOString(),
      xp: totalXp, // Assign total XP to the lesson
      country: parsedLesson.country,
      topic: parsedLesson.topic,
      questions: parsedLesson.questions
    };

    console.log('Lesson object to be added to Shov:', lessonWithId);
    
    try {
      const addResult = await shov.add('lessons', lessonWithId);
      console.log('Shov add result:', addResult);
      
      // Store Shov's internal ID for reliable retrieval
      // Handle different response formats from Shov API
      const shovAssignedId = addResult?.id || addResult?.data?.id || addResult?._id; 
      if (!shovAssignedId && addResult?.success !== true) {
        throw new Error('Failed to get Shov ID for AI-generated lesson');
      }
      
      if (shovAssignedId) {
        lessonWithId.shovId = shovAssignedId;
        console.log('Lesson successfully added to Shov with ID:', shovAssignedId);
      } else if (addResult?.success === true) {
        // Shov returned success but no explicit ID, generate fallback
        lessonWithId.shovId = `temp-${lessonWithId.id}`;
        console.log('Shov success but no ID returned, using temporary shovId:', lessonWithId.shovId);
      }
      
    } catch (addError) {
      console.error('Failed to add AI lesson to Shov:', addError);
      
      // Generate a temporary ID as fallback
      lessonWithId.shovId = `temp-${lessonWithId.id}`;
      console.warn('Using temporary shovId for AI lesson:', lessonWithId.shovId);
    }
    
    // Ensure shovId is always present
    if (!lessonWithId.shovId) {
      lessonWithId.shovId = `emergency-${lessonWithId.id}`;
      console.warn('Emergency shovId assigned to AI lesson:', lessonWithId.shovId);
    }
    console.log('[AI Generation] Final generated lesson:', JSON.stringify(lessonWithId, null, 2));
    return lessonWithId;
    
  } catch (error) {
    console.error('[AI Generation] Failed with detailed error:', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.constructor.name
    });
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      console.error('[AI Generation] JSON parsing failed - invalid response format');
    }
    
    console.log('[AI Generation] Falling back to predefined scenarios...');
    
    // Enhanced fallback lesson with better engagement and randomization
    const fallbackScenarios = {
      'Greetings & Respect': {
        country: country,
        topic: 'Greetings & Respect',
        questions: [
          {
            type: 'multiple_choice',
            question: `You've just arrived in ${country} and meet your host family for the first time. What's the most respectful way to greet them?`,
            options: ['Follow their lead and mirror their greeting style', 'Give everyone a firm handshake', 'Bow formally to show respect', 'Wave and say hello in English'],
            answer: 'Follow their lead and mirror their greeting style',
            explanation: `When unsure about local greeting customs in ${country}, the safest approach is to observe and follow your host's lead. This shows cultural sensitivity and respect for local traditions.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `In ${country}, it's common to use first names immediately upon meeting someone, regardless of age or status.`,
            answer: 'false',
            explanation: `Many cultures, especially in ${country}, place importance on hierarchy and formality. It's often more respectful to use titles and last names until invited to use first names.`,
            xp: 10
          },
          {
            type: 'multiple_choice',
            question: `At a formal event in ${country}, you're introduced to several important people. How should you greet them?`,
            options: ['Wait to see how they greet you first', 'Use the same greeting for everyone', 'Ask each person their preference', 'Stick to your cultural greeting'],
            answer: 'Wait to see how they greet you first',
            explanation: `In ${country}, formal greetings can vary based on age, status, and context. Waiting to see their preferred greeting shows respect and cultural awareness.`,
            xp: 10
          }
        ]
      },
      'Business Customs': {
        country: country,
        topic: 'Business Customs',
        questions: [
          {
            type: 'multiple_choice',
            question: `During a business meeting in ${country}, you notice everyone exchanging business cards ceremonially. What should you do?`,
            options: ['Follow their ritual exactly', 'Hand out your card casually', 'Wait until the meeting ends', 'Ask someone to explain the process'],
            answer: 'Follow their ritual exactly',
            explanation: `Business card exchange in ${country} often follows specific protocols that show respect and professionalism. Observing and following their ceremony demonstrates cultural awareness.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `In ${country}, it's customary to interrupt a senior colleague during a presentation to ask questions.`,
            answer: 'false',
            explanation: `In many business cultures, particularly in ${country}, interrupting a senior person is considered disrespectful. It's best to hold questions until the end of the presentation or a designated Q&A session.`,
            xp: 10
          },
          {
            type: 'multiple_choice',
            question: `You're invited to a business dinner in ${country}. What's the most important consideration?`,
            options: ['Learn the local dining and social etiquette', 'Stick to familiar foods only', 'Focus solely on business topics', 'Arrive exactly on time'],
            answer: 'Learn the local dining and social etiquette',
            explanation: `Business dinners in ${country} blend professional and cultural elements. Understanding local dining customs shows respect and can strengthen business relationships.`,
            xp: 10
          }
        ]
      },
      'Dining Etiquette': {
        country: country,
        topic: 'Dining Etiquette',
        questions: [
          {
            type: 'multiple_choice',
            question: `At a traditional meal in ${country}, you're unsure about the proper etiquette. What should you do?`,
            options: ['Observe others and follow their lead', 'Eat the way you do at home', 'Ask loudly what the rules are', 'Leave the food untouched'],
            answer: 'Observe others and follow their lead',
            explanation: `Dining etiquette varies greatly between cultures. In ${country}, watching and mimicking your hosts shows respect and helps you learn proper customs naturally.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `In ${country}, it's polite to loudly slurp your noodles to show enjoyment of the meal.`,
            answer: 'false',
            explanation: `While slurping noodles is acceptable and even encouraged in some cultures (like Japan), in many others, including ${country}, it's considered impolite. Always observe local customs.`,
            xp: 10
          },
          {
            type: 'multiple_choice',
            question: `During a business dinner in ${country}, you're offered a dish you've never seen before. What's the best approach?`,
            options: ['Try a small portion politely', 'Decline immediately', 'Ask detailed questions about ingredients', 'Wait for others to eat first'],
            answer: 'Try a small portion politely',
            explanation: `In ${country}, showing willingness to try local cuisine demonstrates respect for the culture. Taking a small portion shows courtesy while being considerate of your own comfort.`,
            xp: 10
          }
        ]
      },
      'Age & Hierarchy': {
        country: country,
        topic: 'Age & Hierarchy',
        questions: [
          {
            type: 'multiple_choice',
            question: `In ${country}, you're in a group with people of various ages. How should you show appropriate respect?`,
            options: ['Wait for older members to speak or act first', 'Treat everyone exactly the same', 'Focus on the youngest people', 'Ignore age differences completely'],
            answer: 'Wait for older members to speak or act first',
            explanation: `Many cultures in regions like ${country} have strong respect for age and hierarchy. Allowing older or senior members to lead shows proper cultural understanding.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `When addressing an elder in ${country}, it's appropriate to use casual language and slang.`,
            answer: 'false',
            explanation: `In cultures that value age and hierarchy, using formal language and respectful titles when addressing elders is crucial. Casual language can be seen as highly disrespectful.`,
            xp: 10
          }
        ]
      },
      'Gift Giving': {
        country: country,
        topic: 'Gift Giving',
        questions: [
          {
            type: 'multiple_choice',
            question: `You want to bring a gift when visiting someone's home in ${country}. What's the best approach?`,
            options: ['Research local gift-giving customs first', 'Bring something expensive to impress', 'Dont bring anything to avoid mistakes', 'Bring something from your own country'],
            answer: 'Research local gift-giving customs first',
            explanation: `Gift-giving customs in ${country} can have specific meanings, taboos, and protocols. Understanding these beforehand prevents cultural misunderstandings.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `In ${country}, it's always best to open a gift immediately upon receiving it to show enthusiasm.`,
            answer: 'false',
            explanation: `In some cultures, including ${country}, it's considered more polite to set a gift aside and open it later, often in private, to avoid appearing greedy or to prevent others from feeling obligated to give gifts.`,
            xp: 10
          }
        ]
      },
      'Food Traditions': {
        country: country,
        topic: 'Food Traditions',
        questions: [
          {
            type: 'multiple_choice',
            question: `You're invited to a traditional meal in ${country}. The host serves you with their hands. What should you do?`,
            options: ['Accept graciously and eat with your hands too', 'Ask for utensils politely', 'Decline the food to avoid germs', 'Wait for others to start eating first'],
            answer: 'Accept graciously and eat with your hands too',
            explanation: `In many parts of ${country}, eating with hands is traditional and hygienic when done properly. Accepting graciously shows respect for local customs and hospitality.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `In ${country}, it's common to leave a small amount of food on your plate to show you are full and satisfied.`,
            answer: 'true',
            explanation: `In some cultures, including ${country}, finishing every last bite can imply that you are still hungry or that the host didn't provide enough food. Leaving a small amount can be a sign of politeness.`,
            xp: 10
          },
          {
            type: 'multiple_choice',
            question: `During a family meal in ${country}, you notice everyone eating from shared dishes. What's the proper etiquette?`,
            options: ['Use serving spoons or your right hand only', 'Use your personal utensils to take food', 'Wait for others to serve you', 'Ask for individual portions'],
            answer: 'Use serving spoons or your right hand only',
            explanation: `In ${country}, shared meals are common. Using serving utensils or your right hand (which is considered clean) prevents contamination and shows cultural awareness.`,
            xp: 10
          }
        ]
      },
      'default': {
        country: country,
        topic: topic,
        questions: [
          {
            type: 'multiple_choice',
            question: `When experiencing ${topic.toLowerCase()} in ${country}, what's the most important principle to follow?`,
            options: ['Show respect and cultural sensitivity', 'Do exactly what you do at home', 'Avoid participating entirely', 'Make jokes to break the ice'],
            answer: 'Show respect and cultural sensitivity',
            explanation: `Universal respect and cultural sensitivity are key when navigating ${topic.toLowerCase()} in ${country}. Being observant, respectful, and open to learning will serve you well in any cultural situation.`,
            xp: 10
          },
          {
            type: 'true_false',
            question: `It's always safe to assume that customs in ${country} are similar to those in your home country.`,
            answer: 'false',
            explanation: `Cultural norms vary significantly across the globe. Assuming similarity can lead to misunderstandings or unintentional offense. Always research and be open to learning local customs in ${country}.`,
            xp: 10
          },
          {
            type: 'multiple_choice',
            question: `You're unsure about the appropriate behavior for ${topic.toLowerCase()} in ${country}. What should you do?`,
            options: ['Ask a local friend for guidance', 'Assume its the same as your home country', 'Avoid the situation completely', 'Do whatever feels natural'],
            answer: 'Ask a local friend for guidance',
            explanation: `When in doubt about ${topic.toLowerCase()} in ${country}, asking a trusted local for guidance shows humility and genuine interest in respecting their culture.`,
            xp: 10
          }
        ]
      }
    };

    // Better topic matching - try exact match first, then partial matches
    let selectedFallbackLesson = fallbackScenarios[topic];
    if (!selectedFallbackLesson) {
      // Try partial matching for topics that might have slight variations
      const topicKey = Object.keys(fallbackScenarios).find(key =>
        key.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(key.toLowerCase())
      );
      selectedFallbackLesson = topicKey ? fallbackScenarios[topicKey] : fallbackScenarios['default'];
    }

    // Calculate total XP for the fallback lesson based on individual questions
    let totalXp = 0;
    if (selectedFallbackLesson.questions && Array.isArray(selectedFallbackLesson.questions)) {
      selectedFallbackLesson.questions.forEach(q => {
        q.xp = q.xp || 10; // Ensure each question has an XP, default to 10
        totalXp += q.xp;
      });
    } else {
      // Fallback if for some reason questions array is not present or malformed
      totalXp = 10; // Default XP for a single-question lesson
      selectedFallbackLesson.questions = [{ ...selectedFallbackLesson, xp: 10 }]; // Wrap existing lesson as a single question
    }

    console.log('[Fallback] Selected lesson:', {
      topic,
      matchedKey: selectedFallbackLesson === fallbackScenarios['default'] ? 'default' : topic,
      totalQuestions: selectedFallbackLesson.questions.length,
      totalXp: totalXp
    });

    const fallback = {
      id: `lesson-${Date.now()}-fallback`,
      level: difficulty,
      created_at: new Date().toISOString(),
      isCustom: false, // Explicitly mark as not custom
      xp: totalXp,
      ...selectedFallbackLesson
    };
    
    console.log('Fallback lesson object to be added to Shov:', fallback);
    
    try {
      const addResult = await shov.add('lessons', fallback);
      console.log('Shov add result:', addResult);
      
      // Handle different response formats from Shov API
      const shovAssignedId = addResult?.id || addResult?.data?.id || addResult?._id; 
      if (!shovAssignedId && addResult?.success !== true) {
        throw new Error('Failed to get Shov ID for fallback lesson');
      }
      
      if (shovAssignedId) {
        fallback.shovId = shovAssignedId;
        console.log('Fallback lesson successfully added to Shov with ID:', shovAssignedId);
      } else if (addResult?.success === true) {
        // Shov returned success but no explicit ID, generate fallback
        fallback.shovId = `temp-${fallback.id}`;
        console.log('Shov success but no ID returned, using temporary shovId for fallback:', fallback.shovId);
      }
      
    } catch (addError) {
      console.error('Failed to add fallback lesson to Shov:', addError);
      
      // Generate a temporary ID as last resort to prevent submission failure
      // This allows the lesson to work even if Shov is temporarily unavailable
      fallback.shovId = `temp-${fallback.id}`;
      console.warn('Using temporary shovId as fallback:', fallback.shovId);
    }
    
    // Ensure shovId is always present before returning
    if (!fallback.shovId) {
      fallback.shovId = `emergency-${fallback.id}`;
      console.warn('Emergency shovId assigned:', fallback.shovId);
    }
    
    console.log('[AI Generation] Final generated fallback lesson:', JSON.stringify(fallback, null, 2));
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
  
  // IMPROVED: Add randomization to avoid repetitive lessons
  // Instead of cycling sequentially, use a combination of completed count and randomization
  const baseIndex = completedCount % lessonPairs.length;
  const randomOffset = Math.floor(Math.random() * 5); // Add some randomness
  const finalIndex = (baseIndex + randomOffset) % lessonPairs.length;
  
  const lessonParams = lessonPairs[finalIndex];
  
  console.log('[Lesson Selection] Choosing lesson:', {
    completedCount,
    difficulty,
    baseIndex,
    randomOffset,
    finalIndex,
    selectedLesson: lessonParams
  });

  return {
    ...lessonParams,
    difficulty
  };
}