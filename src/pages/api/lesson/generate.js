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

      const systemPrompt = "You are a helpful assistant designed to output JSON.";
      const userPrompt = `Generate a JSON lesson for a travel customs app called Wandrr based on a user's custom request.\n\nUser Request: "${prompt}"\n\nRequirements:\n- The lesson must be about the user's request.\n- Infer the country and topic from the request. If the request is ambiguous, choose the most likely interpretation.\n- Difficulty: ${difficulty} (1=beginner, 3=expert)\n- Type: ${lessonType}\n\nYour response MUST be a valid JSON object, and ONLY the JSON object. Do NOT include any other text, explanations, or markdown formatting outside the JSON.\n\nJSON Structure Example:\n{\n  "type": "multiple_choice",\n  "country": "USA",\n  "topic": "Tipping",\n  "question": "What is a standard tip for good service in a US restaurant?",\n  "options": ["5-10%", "10-15%", "15-20%", "20-25%"],\n  "answer": "15-20%",\n  "explanation": "A tip of 15-20% is standard for table service in the United States.",\n  "xp": 10\n}`;

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