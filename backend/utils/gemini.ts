/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

/**
 * Lazy-initialize the Gemini client to prevent crashes at module load time
 */
export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to use AI features.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Generate helpful AI feedback response summaries or content categorization helper.
 */
export async function generateStoreFeedbackSummary(storeName: string, feedbackList: string[]): Promise<string> {
  try {
    const ai = getGeminiClient();
    const prompt = `Analyze the feedback for the store "${storeName}":\n\n${feedbackList.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nProvide a concise 2-sentence summary identifying the primary strengths and areas of improvements mentioned by customers.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No summary generated.";
  } catch (err: any) {
    console.error("Gemini summary error:", err.message);
    return "AI Summary is currently unavailable. Please configure the GEMINI_API_KEY.";
  }
}
