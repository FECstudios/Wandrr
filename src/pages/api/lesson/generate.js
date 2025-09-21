import query from '../../../lib/huggingface';
import { Shov } from 'shov-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, user, questionType } = req.body; // Destructure questionType

  if (!prompt || !user) {
    return res.status(400).json({ message: 'Missing required fields: prompt, user' });
  }

  // --- Retry Logic for the entire generation process ---
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`[Generator API] Custom lesson generation attempt ${attempts}`);
      
      const difficulty = Math.min(Math.floor((user.xp || 0) / 50) + 1, 3);

      // Enhanced system prompt for better AI behavior
      const systemPrompt = `You are a world-class cultural expert and educational content creator specialized in travel etiquette and customs. Your expertise spans global cultures, traditions, and social norms. You create engaging, practical lessons that help travelers navigate cultural differences respectfully and confidently.

You ALWAYS respond with valid JSON only - no explanations, no markdown, no extra text.`;
      
      // Dynamic difficulty descriptions
      const difficultyGuide = {
        1: "BEGINNER: Basic, essential knowledge every traveler should know. Simple, clear scenarios.",
        2: "INTERMEDIATE: More nuanced cultural insights. Situations requiring cultural awareness.", 
        3: "ADVANCED: Complex cultural subtleties, business contexts, and sophisticated social situations."
      };

      const userPrompt = `Create an exceptional cultural lesson based on the traveler's specific request: "${prompt}"

📋 REQUIREMENTS:
- Infer the most relevant country and topic from: "${prompt}"
- If ambiguous, choose the most practical interpretation for travelers
- Difficulty: ${difficulty}/3 (${difficultyGuide[difficulty]})
- Format: ${questionType === 'multiple_choice' ? 'Multiple choice questions only.' : questionType === 'true_false' ? 'True/false questions only.' : 'A mix of multiple_choice and true_false questions.'}
- Target: International travelers seeking authentic cultural understanding
- Number of questions: 3-5 (vary the number slightly for natural feel)

🎯 QUALITY STANDARDS:
✅ Questions must be PRACTICAL and scenario-based
✅ Use REAL situations travelers actually encounter
✅ Include specific cultural context and reasoning
✅ Make explanations educational and memorable
✅ Ensure cultural accuracy and sensitivity
✅ Create engaging, story-driven questions
✅ Each question should be distinct and cover different aspects of the topic.
✅ Ensure the correct answer is logically sound and directly addresses the question.
✅ For multiple-choice questions, craft 4 realistic options that could genuinely confuse travelers. Include 1 correct answer and 3 plausible but wrong choices. Make distractors educational (common misconceptions) and avoid obvious wrong answers.
✅ For true/false questions, create statements that test genuine cultural understanding, address common traveler misconceptions, and include nuanced cultural truths that surprise people.

🌟 ENGAGEMENT TECHNIQUES:
- Start questions with scenario contexts ("You're at a restaurant...", "When visiting a temple...")
- Use specific examples rather than generic statements
- Include helpful cultural insights in explanations
- Reference local customs, traditions, or social expectations
- Make it relevant to the user's request: "${prompt}"

🎨 EXAMPLES BY DIFFICULTY:

BEGINNER Example:
{
  "country": "Thailand",
  "topic": "Temple Etiquette",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "You're visiting a Buddhist temple in Bangkok. What should you do before entering the main prayer hall?",
      "options": ["Remove your shoes and hat", "Make a small donation", "Light an incense stick", "Take photos of the Buddha statue"],
      "answer": "Remove your shoes and hat",
      "explanation": "Removing shoes and hats shows respect in Buddhist temples. Your feet are considered the lowest part of the body, so footwear must never touch holy ground. Head coverings are also removed as a sign of humility.",
      "xp": 10
    },
    {
      "type": "true_false",
      "question": "It is acceptable to point your feet directly at a Buddha statue or a person in a Thai temple.",
      "answer": "false",
      "explanation": "In Thai culture, the feet are considered the lowest and dirtiest part of the body. Pointing them at sacred objects or people is highly disrespectful. Always try to tuck your feet away or point them in a neutral direction.",
      "xp": 10
    }
  ]
}

INTERMEDIATE Example:
{
  "country": "Germany",
  "topic": "Social Norms",
  "questions": [
    {
      "type": "true_false",
      "question": "In Germany, being exactly on time for social gatherings is considered fashionably late.",
      "answer": "false",
      "explanation": "Germans value punctuality extremely highly. Arriving exactly on time or even 5-10 minutes early is expected and shows respect. Being late to social events, even by 10 minutes, can be seen as disrespectful and inconsiderate.",
      "xp": 10
    },
    {
      "type": "multiple_choice",
      "question": "When greeting someone formally in Germany, what is the most common practice?",
      "options": ["A firm handshake and direct eye contact", "A light kiss on both cheeks", "A casual wave and a verbal greeting from a distance", "A slight bow of the head"],
      "answer": "A firm handshake and direct eye contact",
      "explanation": "A firm handshake and direct eye contact are standard and expected in formal German greetings, conveying sincerity and respect. Personal space is also generally valued, so avoid overly familiar gestures unless invited.",
      "xp": 10
    }
  ]
}

ADVANCED Example:
{
  "country": "Japan",
  "topic": "Business Customs",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "At a Japanese business meeting, when your counterpart presents their business card (meishi), you should:",
      "options": ["Receive with both hands, read it carefully, and place it respectfully on the table", "Take it with one hand and immediately put it in your wallet", "Accept it casually and set it aside to focus on the meeting", "Examine it briefly and hand over your card simultaneously"],
      "answer": "Receive with both hands, read it carefully, and place it respectfully on the table",
      "explanation": "The meishi exchange is a crucial ritual in Japanese business culture. Receive with both hands, study it respectfully (showing you value the person), and place it carefully on the table in front of you. Never write on it, fold it, or put it away carelessly - it represents the person's honor.",
      "xp": 10
    },
    {
      "type": "true_false",
      "question": "During a Japanese business dinner, it is common to discuss sensitive business topics over the meal.",
      "answer": "false",
      "explanation": "Business dinners in Japan are primarily for building relationships and fostering harmony (wa). Sensitive business discussions are typically reserved for the office. The dinner is a time for socializing and strengthening personal bonds.",
      "xp": 10
    }
  ]
}

⚡ OUTPUT FORMAT:
Respond with ONLY the JSON object. No markdown, no explanations, no extra text.

JSON Structure for a lesson with multiple questions:
{
  "country": "[Inferred from user request]",
  "topic": "[Inferred from user request]",
  "questions": [
    {
      "type": "multiple_choice" or "true_false",
      "question": "[Scenario-based question with specific context related to user's request]",
      "options": ["", "", "", ""], // Only for multiple_choice. Omit for true_false.
      "answer": "[Correct answer - must match one option exactly or 'true'/'false']",
      "explanation": "[Detailed cultural context explaining why this is correct and what travelers should understand]",
      "xp": 10
    }
    // ... up to 5 question objects, with a mix of types
  ]
}

Create your lesson now:`

      const response = await query({
        model: "meta-llama/Llama-3.2-3B-Instruct:hyperbolic",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      });

      const content = response.choices[0].message?.content?.trim();
      let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
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
        isCustom: true,
        xp: totalXp, // Assign total XP to the lesson
        country: parsedLesson.country,
        topic: parsedLesson.topic,
        questions: parsedLesson.questions
      };

      const shov = new Shov({ 
        projectName: process.env.SHOV_PROJECT,
        apiKey: process.env.SHOV_API_KEY 
      });
      const addResult = await shov.add('lessons', lessonWithId);
      const shovAssignedId = addResult?.id; 
      if (shovAssignedId) {
        lessonWithId.shovId = shovAssignedId;
      }

      // If all steps are successful, return the lesson and exit the loop
      return res.status(200).json(lessonWithId);

    } catch (error) {
      console.error(`[Generator API] Attempt ${attempts} failed:`, error.message);
      if (attempts >= maxAttempts) {
        // If all attempts fail, send the final error response
        return res.status(500).json({ message: 'Failed to generate custom lesson after multiple attempts.', error: error.message });
      }
      // Wait a bit before the next attempt
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  // --- End Retry Logic ---
}