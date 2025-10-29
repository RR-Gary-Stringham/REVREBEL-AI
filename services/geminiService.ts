import { GoogleGenAI, type FunctionDeclaration, Type, type Content, type FunctionCall } from "@google/genai";
import type { Mode, Brandscape, Message } from '../types';
import { CORE_SYSTEM_PROMPT, MODE_INSTRUCTIONS } from '../constants';
import * as vectorDB from './vectorDBService';
import { readGoogleDoc } from './googleDocsService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const presentCreativeConceptTool: FunctionDeclaration = {
    name: 'presentCreativeConcept',
    description: 'Presents a single, high-level creative concept to the user for feedback. Used in CREATIVE_IDEATION mode.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            conceptName: {
                type: Type.STRING,
                description: 'A short, catchy name for the concept (e.g., "Retro Arcade Sunset", "Minimalist Tech Grid").'
            },
            description: {
                type: Type.STRING,
                description: 'A one or two-sentence description of the concept\'s vibe and core idea.'
            },
            palette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'An array of 3 to 5 hex color codes that represent the concept visually.'
            }
        },
        required: ['conceptName', 'description', 'palette']
    }
};

const readGoogleDocTool: FunctionDeclaration = {
    name: 'readGoogleDoc',
    description: 'Reads the text content of a publicly accessible Google Document from a given URL.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: {
                type: Type.STRING,
                description: 'The public URL of the Google Document to read.'
            }
        },
        required: ['url']
    }
};


const mapHistoryToContents = (history: Message[]): Content[] => {
    return history.map(msg => {
        if (msg.role === 'model' && msg.toolCall) {
            return {
                role: 'model',
                parts: [{ functionCall: msg.toolCall }]
            };
        }
        if (msg.role === 'tool' && msg.toolResult) {
            return {
                role: 'tool',
                parts: [{
                    functionResponse: {
                        name: msg.toolResult.name,
                        response: msg.toolResult.response,
                    }
                }]
            };
        }
        return {
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        };
    }).filter(c => c.parts.some(p => (p as any).text || (p as any).functionCall || (p as any).functionResponse));
};

async function* streamChatResponse(
    history: Message[],
    mode: Mode,
    useVectorDB: boolean,
    brandscape: Brandscape | null
): AsyncGenerator<{ text?: string; toolCall?: FunctionCall }> {
    const modeInstruction = MODE_INSTRUCTIONS[mode];
    let ragContext = '';

    const latestUserMessage = history.find(m => m.role === 'user');
    
    if (useVectorDB && latestUserMessage) {
        try {
            ragContext = await vectorDB.query(latestUserMessage.content);
        } catch (e) {
            console.error("Failed to query vector DB", e);
        }
    }

    const ragPrompt = ragContext ? `INTERNAL CONTEXT:\n---\n${ragContext}\n---\n` : '';
    const personaPrompt = brandscape ? `PERSONA CONTEXT:\n---\n- Five Words: ${brandscape.fiveWords}\n- Inspirations: ${brandscape.inspirations}\n- Voice Description: ${brandscape.voiceDescription}\n---\n` : '';

    const systemInstruction = `${CORE_SYSTEM_PROMPT}\n\n${modeInstruction}\n\n${personaPrompt}${ragPrompt}`;
    
    const contents = mapHistoryToContents(history);
    const tools = [{ functionDeclarations: [presentCreativeConceptTool, readGoogleDocTool] }];

    try {
        // FIX: Moved `tools` inside the `config` object.
        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                tools: tools,
                systemInstruction: systemInstruction,
            },
        });
        
        let functionCallToProcess: FunctionCall | null = null;

        for await (const chunk of result) {
            if (chunk.text) {
                yield { text: chunk.text };
            }
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                 // For this app's design, we handle one tool call at the end of the model's turn.
                functionCallToProcess = chunk.functionCalls[0];
            }
        }
        
        // After the initial stream, check if a tool needs to be called.
        if (functionCallToProcess) {
            if (functionCallToProcess.name === 'presentCreativeConcept') {
                // This is a UI-facing tool that requires user feedback. Yield it.
                yield { toolCall: functionCallToProcess };
            } else if (functionCallToProcess.name === 'readGoogleDoc') {
                // This is a background tool. Handle it internally.
                yield { text: '\n\n*Reading Google Document...*\n' };
                
                const url = functionCallToProcess.args.url as string;
                const docData = await readGoogleDoc(url);

                const modelTurnWithToolCall: Content = {
                    role: 'model',
                    parts: [{ functionCall: functionCallToProcess }]
                };
                const toolResponse: Content = {
                    role: 'tool',
                    parts: [{ functionResponse: { name: 'readGoogleDoc', response: docData } }]
                };

                const newHistory = [...contents, modelTurnWithToolCall, toolResponse];
                
                yield { text: `*Document analysis complete. Generating response...*\n\n` };

                // Make the second call to get the final response and stream its results.
                // FIX: Moved `tools` inside the `config` object.
                const finalResult = await ai.models.generateContentStream({
                    model: 'gemini-2.5-pro',
                    contents: newHistory,
                    config: {
                        tools: tools,
                        systemInstruction: systemInstruction,
                    },
                });

                for await (const finalChunk of finalResult) {
                    if (finalChunk.text) {
                        yield { text: finalChunk.text };
                    }
                }
            }
        }

    } catch (error) {
        console.error("Gemini API error:", error);
        yield { text: "An error occurred while communicating with the AI model. Please check the console for more details." };
    }
}

export { streamChatResponse };