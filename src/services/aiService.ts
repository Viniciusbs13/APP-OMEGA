import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInsight(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um insight no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar insight com IA.");
  }
}
