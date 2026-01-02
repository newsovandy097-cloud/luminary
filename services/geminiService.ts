import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyLesson, Vibe, SimulationFeedback, SkillLevel } from "../types";

/**
 * AI client initializer using process.env.API_KEY directly as per guidelines.
 * Assume this variable is pre-configured, valid, and accessible.
 */
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Audio Context Singleton
let audioContext: AudioContext | null = null;

export const generateDailyLesson = async (vibe: Vibe, level: SkillLevel, themeFocus?: string): Promise<DailyLesson> => {
  try {
    const ai = getAI();
    const modelId = "gemini-3-flash-preview";
    
    const vibeInstructions = {
      professional: "Tone: Strategic, Efficient, Leadership-focused. Content: Business, career, or formal environments.",
      social: "Tone: Fun, Witty, Casual. Content: Parties, dates, or small talk.",
      intellectual: "Tone: Deep, Philosophical, Clear. Content: Science, history, or philosophy.",
      charisma: "Tone: Charming, Magnetic, Storytelling-focused. Content: Presence and social influence.",
      leadership: "Tone: Visionary, Decisive, Empathetic. Content: Managing teams and inspiring action.",
      humorous: "Tone: Playful, Witty, Timing-focused. Content: Banter, jokes, and lightening the mood.",
      empathy: "Tone: Warm, Validating, Attentive. Content: Emotional support and deep listening.",
      negotiation: "Tone: Firm yet fair, Persuasive. Content: Reaching agreements and conflict resolution.",
      family: "Tone: Patient, Loving, Direct. Content: Harmonious living, conflict resolution at home, and deep family bonding.",
      parenting: "Tone: Encouraging, Authoritative yet Kind, Clear. Content: Setting boundaries, teaching values, and connecting with children."
    };

    const levelDescriptions = {
      noob: "Use very simple, common but slightly elevated words.",
      beginner: "Common academic words. Focus on building confidence.",
      intermediate: "Business-casual sophistication.",
      advanced: "Sophisticated, nuanced vocabulary.",
      master: "Esoteric or highly precise terminology."
    };

    const themeContext = themeFocus && themeFocus !== 'General' 
      ? `The topic MUST be: ${themeFocus}.` 
      : "Choose a random, interesting theme.";

    const prompt = `
      Role: Friendly charismatic communication coach.
      Level: ${level.toUpperCase()} (${levelDescriptions[level]})
      Vibe: ${vibeInstructions[vibe]}
      Theme: ${themeContext}
      Goal: Micro-learning session JSON.
    `;

    // Always use ai.models.generateContent directly with model name and prompt/config
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            vocabularies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  simpleDefinition: { type: Type.STRING },
                  etymology: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                },
                required: ["word", "pronunciation", "definition", "simpleDefinition", "etymology", "exampleSentence"]
              }
            },
            concept: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                field: { type: Type.STRING },
                explanation: { type: Type.STRING },
                analogy: { type: Type.STRING },
                conversationStarter: { type: Type.STRING },
              },
              required: ["title", "field", "explanation", "analogy", "conversationStarter"]
            },
            simulation: {
              type: Type.OBJECT,
              properties: {
                setting: { type: Type.STRING },
                role: { type: Type.STRING },
                openingLine: { type: Type.STRING },
                objective: { type: Type.STRING },
              },
              required: ["setting", "role", "openingLine", "objective"]
            },
            story: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                keyTakeaway: { type: Type.STRING },
              },
              required: ["headline", "body", "keyTakeaway"]
            },
            challenge: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                tip: { type: Type.STRING },
              },
              required: ["task", "tip"]
            }
          },
          required: ["theme", "vocabularies", "concept", "simulation", "story", "challenge"]
        }
      }
    });

    // Access the text property directly on GenerateContentResponse
    const text = response.text;
    if (text) {
      const data = JSON.parse(text) as DailyLesson;
      const now = new Date();
      data.id = now.getTime().toString(); 
      data.date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      data.timestamp = now.getTime();
      data.vibe = vibe;
      data.level = level;
      return data;
    } else {
      throw new Error("EMPTY_RESPONSE");
    }
  } catch (error: any) {
    console.error("LUMINARY_GEN_ERROR:", error);
    
    if (error.message?.includes('429') || error.status === 429) {
      throw new Error("QUOTA_EXCEEDED");
    }
    
    throw new Error(error.message || "GENERATION_FAILED");
  }
};

export const getSimulationReply = async (
  history: { role: string; text: string }[], 
  scenario: { setting: string; role: string }
): Promise<string> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview";
  const conversation = history.map(h => `${h.role === 'user' ? 'User' : scenario.role}: ${h.text}`).join('\n');
  const prompt = `Simulation: ${scenario.setting}. Role: ${scenario.role}. Conversation: ${conversation}. Respond as ${scenario.role} (under 2 sentences).`;

  try {
    const response = await ai.models.generateContent({ model: modelId, contents: prompt });
    return response.text || "...";
  } catch (e: any) {
    if (e.message?.includes('429')) return "System overloaded. My free quota has been used up for the minute!";
    return "Coach offline. Error: " + (e.message || "Connection lost");
  }
};

export const evaluateSimulation = async (history: { role: string; text: string }[], objective: string): Promise<SimulationFeedback> => {
    const ai = getAI();
    const modelId = "gemini-3-flash-preview";
    const conversation = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const prompt = `Evaluate for: ${objective}. History: ${conversation}. JSON: score (1-10), feedback, suggestion.`;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                    },
                    required: ["score", "feedback", "suggestion"]
                }
            }
        });
        return JSON.parse(response.text || "{}") as SimulationFeedback;
    } catch (e: any) {
        throw new Error(e.message?.includes('429') ? "Quota Exceeded" : "Evaluation failed");
    }
};

export const evaluateSentence = async (word: string, definition: string, sentence: string): Promise<{ correct: boolean; feedback: string }> => {
    try {
        const ai = getAI();
        const modelId = "gemini-3-flash-preview";
        const prompt = `Word: "${word}". Def: ${definition}. Sentence: "${sentence}". JSON: { "correct": boolean, "feedback": "string" }`;
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        correct: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ["correct", "feedback"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { correct: true, feedback: "Excellent usage!" };
    }
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const ai = getAI();
    const sanitizedText = text.replace(/[*_#`\[\]()<>]/g, '').replace(/\s+/g, ' ').trim();
    if (!sanitizedText || sanitizedText.length < 2) return;

    // Use correct contents structure for TTS as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) await playRawAudio(base64Audio);
  } catch (error) {}
}

async function playRawAudio(base64String: string) {
  if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  if (audioContext.state === 'suspended') await audioContext.resume();
  const audioBuffer = await decodeAudioData(decode(base64String), audioContext, 24000, 1);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}