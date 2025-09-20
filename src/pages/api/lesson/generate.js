import query from '../../../lib/huggingface';
import { Shov } from 'shov-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, user } = req.body;

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
      const lessonType = ['multiple_choice', 'true_false'][Math.floor(Math.random() * 2)];

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
- Format: ${lessonType}
- Target: International travelers seeking authentic cultural understanding

🎯 QUALITY STANDARDS:
✅ Questions must be PRACTICAL and scenario-based
✅ Use REAL situations travelers actually encounter
✅ Include specific cultural context and reasoning
✅ Make explanations educational and memorable
✅ Ensure cultural accuracy and sensitivity
✅ Create engaging, story-driven questions

📚 QUESTION GUIDELINES:
${lessonType === 'multiple_choice' ? `
• Craft 4 realistic options that could genuinely confuse travelers
• Include 1 correct answer and 3 plausible but wrong choices
• Make distractors educational (common misconceptions)
• Avoid obvious wrong answers` : `
• Create statements that test genuine cultural understanding
• Address common traveler misconceptions
• Include nuanced cultural truths that surprise people`}

🌟 ENGAGEMENT TECHNIQUES:
- Start questions with scenario contexts ("You're at a restaurant...", "When visiting a temple...")
- Use specific examples rather than generic statements
- Include helpful cultural insights in explanations
- Reference local customs, traditions, or social expectations
- Make it relevant to the user's request: "${prompt}"

🎨 EXAMPLES BY DIFFICULTY:

BEGINNER Example:
{
  "type": "multiple_choice",
  "country": "Thailand",
  "topic": "Temple Etiquette",
  "question": "You're visiting a Buddhist temple in Bangkok. What should you do before entering the main prayer hall?",
  "options": ["Remove your shoes and hat", "Make a small donation", "Light an incense stick", "Take photos of the Buddha statue"],
  "answer": "Remove your shoes and hat",
  "explanation": "Removing shoes and hats shows respect in Buddhist temples. Your feet are considered the lowest part of the body, so footwear must never touch holy ground. Head coverings are also removed as a sign of humility.",
  "xp": 10
}

INTERMEDIATE Example:
{
  "type": "true_false",
  "country": "Germany",
  "topic": "Social Norms",
  "question": "In Germany, being exactly on time for social gatherings is considered fashionably late.",
  "answer": "false",
  "explanation": "Germans value punctuality extremely highly. Arriving exactly on time or even 5-10 minutes early is expected and shows respect. Being late to social events, even by 10 minutes, can be seen as disrespectful and inconsiderate.",
  "xp": 10
}

ADVANCED Example:
{
  "type": "multiple_choice",
  "country": "Japan",
  "topic": "Business Customs",
  "question": "At a Japanese business meeting, when your counterpart presents their business card (meishi), you should:",
  "options": ["Receive with both hands, read it carefully, and place it respectfully on the table", "Take it with one hand and immediately put it in your wallet", "Accept it casually and set it aside to focus on the meeting", "Examine it briefly and hand over your card simultaneously"],
  "answer": "Receive with both hands, read it carefully, and place it respectfully on the table",
  "explanation": "The meishi exchange is a crucial ritual in Japanese business culture. Receive with both hands, study it respectfully (showing you value the person), and place it carefully on the table in front of you. Never write on it, fold it, or put it away carelessly - it represents the person's honor.",
  "xp": 10
}

⚡ OUTPUT FORMAT:
Respond with ONLY the JSON object. No markdown, no explanations, no extra text.

JSON Structure for ${lessonType}:
${lessonType === 'multiple_choice' ? `{
  "type": "multiple_choice",
  "country": "[Inferred from user request]",
  "topic": "[Inferred from user request]",
  "question": "[Scenario-based question with specific context related to user's request]",
  "options": ["[Correct answer]", "[Plausible wrong answer 1]", "[Plausible wrong answer 2]", "[Plausible wrong answer 3]"],
  "answer": "[Correct answer - must match one option exactly]",
  "explanation": "[Detailed cultural context explaining why this is correct and what travelers should understand]",
  "xp": 10
}` : `{
  "type": "true_false",
  "country": "[Inferred from user request]",
  "topic": "[Inferred from user request]",
  "question": "[Specific cultural statement that tests genuine understanding related to user's request]",
  "answer": "true" or "false",
  "explanation": "[Clear explanation of the cultural reality and practical implications for travelers]",
  "xp": 10
}`}

Create your lesson now:`;

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
      lesson.xp = 10;

      const lessonWithId = {
        id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: difficulty,
        created_at: new Date().toISOString(),
        isCustom: true,
        ...lesson
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