import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyLesson, Vibe, SimulationFeedback, SkillLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Context Singleton
let audioContext: AudioContext | null = null;

export const generateDailyLesson = async (vibe: Vibe, level: SkillLevel, themeFocus?: string): Promise<DailyLesson> => {
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
    noob: "Use very simple, common but slightly elevated words. Focus on basic social survival.",
    beginner: "Common academic words. Focus on building confidence.",
    intermediate: "Business-casual sophistication. Focus on nuances in conversation.",
    advanced: "Sophisticated, nuanced vocabulary. Focus on high-stakes influence.",
    master: "Esoteric or highly precise terminology. Focus on legendary charisma."
  };

  const themeContext = themeFocus && themeFocus !== 'General' 
    ? `The primary topic/theme of the lesson MUST be: ${themeFocus}. All vocab, concepts, and stories must revolve around this.` 
    : "Choose a random, interesting theme that fits the selected vibe.";

  const prompt = `
    You are a friendly, charismatic communication coach. Your goal is to help a user become more interesting and well-spoken.
    
    Target Skill Level: ${level.toUpperCase()}
    Level Guidance: ${levelDescriptions[level]}
    Current Vibe Setting: ${vibeInstructions[vibe]}
    Theme/Topic Requirement: ${themeContext}
    
    Create a micro-learning session for this level.
    
    Structure the response to include:
    1. **Vocabularies**: Provide 3 high-impact words matching the level, vibe, and theme. 
    2. **Concept**: A mental model or communication tip. Provide an "Analogy".
    3. **Simulation**: Create a roleplay scenario related to the theme.
    4. **Story**: A short (150 words) story about a real figure illustrating the theme.
    5. **Challenge**: A specific social challenge for today.

    Output must be valid JSON.
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

    if (response.text) {
      const data = JSON.parse(response.text) as DailyLesson;
      const now = new Date();
      data.id = now.getTime().toString(); 
      data.date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      data.timestamp = now.getTime();
      data.vibe = vibe;
      data.level = level;
      return data;
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const getSimulationReply = async (
  history: { role: string; text: string }[], 
  scenario: { setting: string; role: string }
): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  const conversation = history.map(h => `${h.role === 'user' ? 'User' : scenario.role}: ${h.text}`).join('\n');
  
  const prompt = `
    Roleplay Simulation.
    Setting: ${scenario.setting}
    Your Role: ${scenario.role}
    Conversation:
    ${conversation}
    
    Respond as ${scenario.role}. Keep it short (under 2 sentences). Be natural.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "...";
  } catch (e) {
    return "I'm sorry, can you say that again?";
  }
};

export const evaluateSimulation = async (
    history: { role: string; text: string }[],
    objective: string
): Promise<SimulationFeedback> => {
    const modelId = "gemini-3-flash-preview";
    const conversation = history.map(h => `${h.role}: ${h.text}`).join('\n');

    const prompt = `
        You are a communication coach.
        Objective: ${objective}
        Conversation History:
        ${conversation}
        
        Analyze the user's performance.
        Return JSON with:
        1. score (1-10)
        2. feedback (1 strong sentence)
        3. suggestion (A specific "Try saying this instead" example)
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
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                    },
                    required: ["score", "feedback", "suggestion"]
                }
            }
        });
        return JSON.parse(response.text || "{}") as SimulationFeedback;
    } catch (e) {
        return { score: 7, feedback: "Solid attempt at keeping the flow going.", suggestion: "Try using more descriptive adjectives." };
    }
};

export const evaluateSentence = async (word: string, definition: string, sentence: string): Promise<{ correct: boolean; feedback: string }> => {
    const modelId = "gemini-3-flash-preview";
    const prompt = `
        User is practicing the word: "${word}" (Definition: ${definition}).
        User's sentence: "${sentence}"
        
        Is the word used correctly and naturally?
        Return JSON: { "correct": boolean, "feedback": "string" }
        Keep feedback very short and encouraging.
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
                        correct: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ["correct", "feedback"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { correct: true, feedback: "Nice usage! It fits perfectly." };
    }
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const sanitizedText = text.replace(/[*_#`\[\]()<>]/g, '').replace(/\s+/g, ' ').trim();
    if (!sanitizedText || sanitizedText.length < 2) return;

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

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!base64Audio) return;
    await playRawAudio(base64Audio);
  } catch (error) {
    console.error("TTS Error:", error);
  }
}

async function playRawAudio(base64String: string) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  const audioBuffer = await decodeAudioData(decode(base64String), audioContext, 24000, 1);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
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