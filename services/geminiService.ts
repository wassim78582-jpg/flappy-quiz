import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface QuizResponse {
  summary: string;
  questions: Question[];
}

export const generateQuizFromNotes = async (notes: string): Promise<QuizResponse> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A concise summary of the notes provided." },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["MCQ", "TRUE_FALSE"] },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
          },
          required: ["id", "type", "question", "options", "correctAnswer"],
        },
      },
    },
    required: ["summary", "questions"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a study quiz based on the following notes. 
      Generate a short summary and 5-7 challenging questions. 
      Mix Multiple Choice and True/False.
      
      Notes:
      ${notes}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizResponse;
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};