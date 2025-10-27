
import { GoogleGenAI } from "@google/genai";
import type { Mode } from '../types';
import { CORE_SYSTEM_PROMPT, MODE_INSTRUCTIONS } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function* generateResponse(prompt: string, mode: Mode): AsyncGenerator<string, void, unknown> {
  const modeInstruction = MODE_INSTRUCTIONS[mode];
  const fullPrompt = `${modeInstruction}\n\nUser request: "${prompt}"`;

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction: CORE_SYSTEM_PROMPT,
      },
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    yield "An error occurred while communicating with the AI model. Please check the console for more details.";
  }
}

export { generateResponse };
