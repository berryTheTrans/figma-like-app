import { GoogleGenAI } from "@google/genai";
import { Layer } from "../types";

const SYSTEM_INSTRUCTION = `
You are a design assistant API. Your job is to generate a JSON object representing a design layer based on the user's prompt.
The output must be a valid JSON object matching this structure:
{
  "name": string,
  "type": "RECTANGLE" | "CIRCLE" | "TEXT" | "STICKY",
  "width": number,
  "height": number,
  "fill": string (hex code),
  "content": string (if type is TEXT or STICKY)
}

Defaults:
- If standard shape: 100x100
- If Text: reasonable width based on length.
- Colors: Modern UI hex codes.
`;

export const generateDesignElement = async (prompt: string): Promise<Partial<Layer> | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a design element for: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};

export const generateTextContent = async (context: string): Promise<string> => {
   if (!process.env.API_KEY) return "AI Configuration Missing";
   
   try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate short, punchy placeholder text for a UI design. Context: ${context}. Max 10 words.`,
    });
    return response.text || "Lorem Ipsum";
   } catch (e) {
     return "Error generating text";
   }
}