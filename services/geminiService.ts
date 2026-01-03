import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyLesson, Vibe, SimulationFeedback, SkillLevel } from "../types";

// Helper to get or create AI instance securely
const getAI = () => {
  let key = '';
  
  // 1. Check standard process.env (Node/CRA/Next.js)
  if (typeof process !== 'undefined' && process.env) {
    key = process.env.API_KEY || process.env.VITE_API_KEY || process.env.REACT_APP_API_KEY || '';
  }

  // 2. Check import.meta.env (Vite standard)
  if (!key && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    key = (import.meta as any).env.VITE_API_KEY || (import.meta as any).env.API_KEY || '';
  }

  if (!key) {
    throw new Error("Authentication Error: API Key is missing. Please set VITE_API_KEY in your Vercel Environment Variables.");
  }

  return new GoogleGenAI({ apiKey: key });
};

// Audio Context & Cache Singleton
let audioContext: AudioContext | null = null;
const audioCache = new Map<string, AudioBuffer>();

export const generateDailyLesson = async (vibe: Vibe, level: SkillLevel, themeFocus?: string): Promise<DailyLesson> => {
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
    Requirement: Provide exactly 3 distinct example sentences for each vocabulary word. Include the Khmer translation/definition for each word.
  `;

  try {
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
                  khmerDefinition: { type: Type.STRING },
                  etymology: { type: Type.STRING },
                  exampleSentences: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 distinct example sentences using the word."
                  },
                },
                required: ["word", "pronunciation", "definition", "simpleDefinition", "khmerDefinition", "etymology", "exampleSentences"]
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
      throw new Error("Empty response from AI. Possible safety filter trigger.");
    }
  } catch (error: any) {
    console.error("LUMINARY GENERATION ERROR:", error);
    throw new Error(error.message || "Failed to generate lesson content.");
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
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "...";
  } catch (e: any) {
    console.error("Simulation Reply Error:", e);
    return "The communication engine is struggling to respond. Error: " + (e.message || "");
  }
};

export const generateSimulationHint = async (
    history: { role: string; text: string }[],
    scenario: { setting: string; role: string },
    level: string
): Promise<string> => {
    const ai = getAI();
    const modelId = "gemini-3-flash-preview";
    const conversation = history.map(h => `${h.role === 'user' ? 'User' : scenario.role}: ${h.text}`).join('\n');

    const prompt = `
        Context: ${scenario.setting}. Role: ${scenario.role}.
        History: ${conversation}
        Task: Suggest a single, short, confident response for the User.
        Level: ${level}.
        Output: Just the response text, nothing else.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });
        return response.text?.trim() || "";
    } catch (e) {
        return "I'm not sure what to say.";
    }
}

export const evaluateSimulation = async (
    history: { role: string; text: string }[],
    objective: string
): Promise<SimulationFeedback> => {
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
        console.error("Simulation Evaluation Error:", e);
        throw new Error("Evaluation failed: " + e.message);
    }
};

export const evaluateSentence = async (word: string, definition: string, sentence: string): Promise<{ correct: boolean; feedback: string }> => {
    const ai = getAI();
    const modelId = "gemini-3-flash-preview";
    const prompt = `Word: "${word}". Def: ${definition}. Sentence: "${sentence}". JSON: { "correct": boolean, "feedback": "string" }`;

    try {
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
        return { correct: true, feedback: "Nice usage!" };
    }
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const sanitizedText = text.replace(/[*_#`\[\]()<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!sanitizedText || sanitizedText.length < 2) return;

  // Try Gemini TTS First
  try {
    // Initialize Audio Context
    if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioContext.state === 'suspended') await audioContext.resume();

    // CHECK CACHE FIRST
    if (audioCache.has(sanitizedText)) {
      const cachedBuffer = audioCache.get(sanitizedText);
      if (cachedBuffer) {
        await playAudioBuffer(cachedBuffer, audioContext);
        return;
      }
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: sanitizedText }] }], // Ensure strict structure
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      // STORE IN CACHE
      audioCache.set(sanitizedText, audioBuffer);
      await playAudioBuffer(audioBuffer, audioContext);
      return;
    } else {
        throw new Error("Gemini returned empty audio.");
    }
  } catch (error) {
    console.warn("Gemini TTS failed, attempting fallback to browser speech...", error);
    await playBrowserTTS(sanitizedText);
  }
}

// Fallback to Web Speech API
const playBrowserTTS = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Browser does not support text-to-speech.");
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a high-quality English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) 
                        || voices.find(v => v.lang.startsWith("en"));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
        console.error("Browser TTS error:", e);
        resolve(); // Resolve anyway to unblock UI
    };

    window.speechSynthesis.speak(utterance);
    
    // Safety timeout in case onend never fires
    setTimeout(resolve, 15000);
  });
};

async function playAudioBuffer(buffer: AudioBuffer, context: AudioContext) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  // Return a promise that resolves when audio finishes
  return new Promise<void>((resolve) => {
    source.onended = () => resolve();
  });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  // Use slice() to ensure we have a fresh, aligned buffer copy of just the audio data
  const alignedBuffer = data.slice().buffer;
  
  // Ensure strict alignment for 16-bit
  if (alignedBuffer.byteLength % 2 !== 0) {
      throw new Error("Audio data length is not a multiple of 2 bytes.");
  }

  const dataInt16 = new Int16Array(alignedBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}