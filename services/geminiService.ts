import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyLesson, Vibe, SimulationFeedback, SkillLevel } from "../types";

/**
 * AI client initialization.
 * Directly uses process.env.API_KEY as per core requirements.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Context Singleton
let audioContext: AudioContext | null = null;

export const generateDailyLesson = async (vibe: Vibe, level: SkillLevel, themeFocus?: string): Promise<DailyLesson> => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
    const vibeInstructions = {
      professional: "Tone: Strategic, Leadership-focused. Content: Formal environments.",
      social: "Tone: Witty, Casual. Content: Social small talk.",
      intellectual: "Tone: Deep, Philosophical. Content: Science and history.",
      charisma: "Tone: Magnetic, Charming. Content: Social influence.",
      leadership: "Tone: Decisive, Empathetic. Content: Management.",
      humorous: "Tone: Playful, Witty. Content: Banter.",
      empathy: "Tone: Warm, Attentive. Content: Emotional intelligence.",
      negotiation: "Tone: Persuasive, Fair. Content: Agreements.",
      family: "Tone: Patient, Loving. Content: Home life.",
      parenting: "Tone: Encouraging, Clear. Content: Child development."
    };

    const prompt = `
      Role: Expert Communication Coach.
      Level: ${level.toUpperCase()}
      Vibe: ${vibeInstructions[vibe]}
      Focus: ${themeFocus || 'General interesting knowledge'}
      Task: Generate a 15-minute micro-learning session in JSON format.
    `;

    const response = await ai.models.generateContent({
      model,
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

    const data = JSON.parse(response.text || "{}") as DailyLesson;
    const now = new Date();
    data.id = now.getTime().toString(); 
    data.date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    data.timestamp = now.getTime();
    data.vibe = vibe;
    data.level = level;
    return data;
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
};

export const getSimulationReply = async (history: { role: string; text: string }[], scenario: { setting: string; role: string }): Promise<string> => {
  const ai = getAI();
  const conversation = history.map(h => `${h.role === 'user' ? 'User' : scenario.role}: ${h.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Scenario: ${scenario.setting}. Your Role: ${scenario.role}. Chat: ${conversation}. Response (1-2 sentences):`
  });
  return response.text || "...";
};

export const evaluateSimulation = async (history: { role: string; text: string }[], objective: string): Promise<SimulationFeedback> => {
  const ai = getAI();
  const conversation = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Objective: ${objective}. Chat: ${conversation}. Evaluate as communication coach in JSON (score 1-10, feedback, suggestion).`,
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
  return JSON.parse(response.text || "{}");
};

export const evaluateSentence = async (word: string, definition: string, sentence: string): Promise<{ correct: boolean; feedback: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Word: ${word} (Def: ${definition}). Sentence: "${sentence}". Is this correct? Response JSON {correct: boolean, feedback: string}.`,
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
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const ai = getAI();
    const cleanText = text.replace(/[*_#`]/g, '').trim();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) await playRawAudio(base64Audio);
  } catch (error) {}
};

async function playRawAudio(base64String: string) {
  if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  if (audioContext.state === 'suspended') await audioContext.resume();
  const data = decode(base64String);
  const audioBuffer = await decodeAudioData(data, audioContext, 24000, 1);
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