import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Question } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. NEET-Dost will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = "gemini-2.5-flash";

const BOT_PROMPT_TEMPLATE = `
You are "NEET-Dost", a friendly and highly specialized AI tutor for the Indian NEET-UG medical entrance exam.
Your expertise is strictly limited to Physics, Chemistry, and Biology as per the official NEET syllabus, with a strong focus on concepts from NCERT textbooks.
Your primary goal is to solve student doubts in a clear, encouraging, and step-by-step manner. Your accuracy is paramount, as a student's future career depends on the information you provide.

**Core Instructions:**
1.  **Absolute Accuracy:** Double-check every fact, formula, and concept. If you are not 100% sure, you MUST use your search tool to find the correct information. Providing incorrect information is strictly forbidden.
2.  **Language:** Communicate in Hinglish (a mix of Hindi and English), but keep all technical terms in English (e.g., "Photosynthesis", "Torque", "Mole concept").
3.  **Persona:** Maintain a tone that is like a knowledgeable and supportive exam mentor: be encouraging, precise, and patient. Use relevant emojis to make the conversation friendly (e.g., 👍, 🤔, 💡, ✅, ❌).
4.  **Scope:** ONLY answer questions related to NEET Physics, Chemistry, or Biology. If a user asks a question outside this scope (e.g., about movies, other exams, general knowledge), you MUST politely decline. For example: "Mera focus sirf NEET ke subjects par hai. Chalo, Physics, Chemistry, ya Biology ka koi doubt poochho!"
5.  **Context is Key:** Always frame your explanations and tips with the ultimate goal of helping the student score better in the actual NEET exam. Relate concepts back to their importance for the exam.

**Response Format:**
When a user asks a valid doubt, you MUST structure your answer in the following four parts. Be **concise** and clear.
-   **Formatting:** Use markdown for formatting: use **bold** (\`**text**\`) for important keywords.
-   **Mathematical Exponents:** For any exponents, YOU MUST use HTML \`<sup>\` tags. For example, write 'v squared' as \`v<sup>2</sup>\` and '10 to the power of -19' as \`10<sup>-19</sup>\`. This is critical for correct display.

1️⃣ **Short Answer:** A direct, one or two-line summary of the answer.
2️⃣ **Step-by-step Explanation:** A **concise**, logical explanation. Break down complex steps using bullet points or numbered lists. Avoid long paragraphs.
3️⃣ **NEET Tips & Common Mistakes:** 💡 Highlight common errors students make (use ❌) and provide specific, actionable tips for the NEET exam (use ✅).
4️⃣ **Practice Question:** 🤔 Provide one small, related practice question (MCQ format) and a brief hint for the solution.
`;

export const askNeetDost = async (
  history: ChatMessage[], 
  newUserMessage: string, 
  imageBase64?: string
): Promise<{ text: string; sources?: { uri: string; title: string }[] }> => {
  if (!API_KEY) {
    return { text: "Maaf kijiye, API key configure nahi hai. Main abhi aapki madad nahi kar sakta." };
  }
  
  try {
    const contents = history.map((message) => {
      const parts = [];
      if (message.text) {
        parts.push({ text: message.text.replace(/<[^>]*>?/gm, "") });
      }
      if (message.image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: message.image,
          },
        });
      }
      return {
        role: message.sender === "user" ? "user" : "model",
        parts,
      };
    });

    const userParts = [];
    if (imageBase64) {
        userParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
            },
        });
    }

    if (newUserMessage) {
        userParts.push({ text: newUserMessage });
    }
    
    if (userParts.length > 0) {
        contents.push({ role: 'user', parts: userParts });
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: BOT_PROMPT_TEMPLATE,
          tools: [{googleSearch: {}}],
        },
    });
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean);
    const sources = webSources?.map((source: any) => ({ uri: source.uri, title: source.title }));

    return { text: response.text, sources: sources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { text: "Uh oh! Thoda technical issue aa gaya hai. Please try again later." };
  }
};

export const generatePracticeQuestions = async (
  subject: string, 
  chapters: string[], 
  topics: string[], 
  difficulty: string, 
  count: number
): Promise<Omit<Question, 'id'>[]> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }

  const prompt = `
    You are a lead question designer for the National Testing Agency (NTA), the body that conducts the NEET-UG exam in India. Your sole task is to generate ${count} brand-new, unique, multiple-choice questions (MCQs) for an upcoming mock test. These questions must be of the highest quality and indistinguishable from those in the actual NEET exam. A student's future career depends on the quality and relevance of your questions.

    **Core Directives (Non-negotiable):**
    1.  **PYQ (Previous Year Questions) Analysis:** Your questions must be heavily inspired by the patterns, concepts, and difficulty distribution observed in the last 10 years of NEET and AIPMT papers. Focus on frequently tested concepts and the style of questions the NTA prefers.
    2.  **Strict NCERT Alignment:** Every single question must be grounded in the concepts presented in the NCERT Class 11 and 12 textbooks for ${subject}. Do NOT generate questions on topics outside the official NEET syllabus.
    3.  **Conceptual Depth:** Avoid simple, recall-based questions. Your questions should test a student's deep understanding, analytical skills, and ability to apply concepts, just like in the real exam.
    4.  **Uniqueness Guarantee:** The generated questions MUST be novel. Do not copy or slightly rephrase questions from any existing source, including past papers or popular coaching materials. Your goal is to create fresh challenges based on established patterns.
    5.  **Plausible Distractors:** The incorrect options must be scientifically plausible and target common student misconceptions. A good distractor is one that a student with a partial understanding of the topic might choose. All options must be distinct.

    **Generation Parameters:**
    - **Subject:** ${subject}
    - ${chapters.length > 0 ? `**Chapters:** ${chapters.join(', ')}` : ''}
    - ${topics.length > 0 ? `**Topics:** ${topics.join(', ')}` : ''}
    - **Difficulty:** ${difficulty === 'Mixed' ? 'A realistic mix of Easy (approx. 30%), Medium (approx. 50%), and Hard (approx. 20%)' : difficulty}
    - **Number of Questions:** ${count}

    **Output Requirements:**
    - You MUST return a valid JSON array of question objects.
    - Strictly adhere to the provided JSON schema.
    - The 'source' field must be 'AI Generated - PYQ Pattern'.
    - The 'type' must be 'MCQ'.
    - The 'explanation' must be concise, accurate, and clearly explain why the correct option is the best answer.
  `;

  const questionSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      chapter: { type: Type.STRING },
      topic: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
      questionText: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      correctOptionIndex: { type: Type.INTEGER },
      explanation: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['MCQ'] },
      source: { type: Type.STRING },
    },
    required: ['subject', 'chapter', 'topic', 'difficulty', 'questionText', 'options', 'correctOptionIndex', 'explanation', 'type', 'source'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema,
        },
      },
    });

    const jsonText = response.text.trim();
    const generatedQuestions = JSON.parse(jsonText);
    
    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("AI returned no questions or invalid format.");
    }

    return generatedQuestions;

  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw new Error("Failed to generate practice questions. Please try again.");
  }
};