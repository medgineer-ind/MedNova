import { GoogleGenAI, Type } from "@google/genai";
import { Question, ChatMessage } from "../types";

// FIX: Simplify API client initialization according to guidelines.
// Assume process.env.API_KEY is pre-configured and available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


const model = "gemini-2.5-flash";

export const generatePracticeQuestions = async (
  subject: string, 
  chapters: string[], 
  topics: string[], 
  difficulty: string, 
  count: number
): Promise<Omit<Question, 'id'>[]> => {
  // FIX: Remove redundant null check for 'ai' instance.
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

// FIX: Implement the missing 'askNeetDost' function for the AI Tutor.
export const askNeetDost = async (
  history: ChatMessage[],
  question: string,
  imageBase64?: string
): Promise<{ text: string; sources: { uri: string; title: string }[] }> => {
  const systemInstruction = `You are NEET-Dost, an expert AI tutor for the Indian NEET-UG medical entrance exam. Your personality is encouraging, clear, and highly knowledgeable. Your primary goal is to solve student doubts in Physics, Chemistry, and Biology with exceptional clarity and depth.

**Response Structure (MANDATORY):**
You MUST structure EVERY response using the following format, using markdown for formatting. Do not deviate from this structure.

1️⃣ **Short Answer:**
Start with a direct, concise answer to the student's question. Get straight to the point.

2️⃣ **Step-by-step Explanation:**
Provide a detailed, logical explanation. Break down complex concepts into simple, easy-to-understand steps. Use analogies if helpful. For numerical problems, show all calculation steps clearly.

3️⃣ **NEET Tips & Common Mistakes:**
Offer a valuable tip related to the concept for the NEET exam. Mention common pitfalls or misconceptions students have about this topic and how to avoid them.

4️⃣ **Practice Question:**
(Optional, but highly recommended) Provide a new, relevant MCQ-style practice question based on the concept discussed. Include four options and the correct answer with a brief explanation.

**Core Instructions:**
- **Clarity is Key:** Explain things as if you're talking to a 17-year-old high school student.
- **NCERT Focus:** Base your explanations on the NCERT curriculum, which is the foundation for the NEET exam.
- **Web Search:** Use your web search capability to provide the most accurate, up-to-date information, especially for definitions, facts, and recent discoveries. You MUST cite your sources.
- **Image Analysis:** If an image is provided, analyze it carefully as the primary context for the student's question.
`;
  // Map history to Gemini's format. Filter out the initial bot greeting.
  const contents = history
    .filter(m => m.sender === 'user' || (m.sender === 'bot' && m.text !== "Hi! I am NEET-Dost. How can I help you with Physics, Chemistry, or Biology today?"))
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
  }));
  
  const userParts: any[] = [{ text: question }];
  if (imageBase64) {
      userParts.push({
          inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg, can be improved to detect mimeType from file
              data: imageBase64
          }
      });
  }
  contents.push({ role: 'user', parts: userParts });

  try {
      const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }],
          },
      });
      
      const text = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: { uri: string; title: string }[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
        }))
        .filter((source: any) => source.uri && source.title);

      // Deduplicate sources by URI
      const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
      
      return { text, sources: uniqueSources };
  } catch (error) {
      console.error("Error asking NEET-Dost:", error);
      throw new Error("Failed to get a response from the AI tutor. Please try again.");
  }
};
