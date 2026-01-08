import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyLesson, Vibe, SimulationFeedback, SkillLevel } from "../types";

// Helper to get or create AI instance securely using the provided environment variable
const getAI = () => {
  let key = '';
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      key = process.env.API_KEY || process.env.REACT_APP_API_KEY || '';
    }
  } catch (e) {}

  if (!key) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || '';
      }
    } catch (e) {}
  }

  return new GoogleGenAI({ apiKey: key });
};

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
    Requirement: 
    1. Provide exactly 3 distinct example sentences for each vocabulary word.
    2. Provide 'khmerDefinition': accurate translation in Khmer language.
    3. Provide 'mnemoLink': A creative, vivid, or funny mental image/association to help remember the word forever (Brain Glue).
    4. Provide 'emotionalTrigger': 1-2 words describing the feeling/vibe of using this word.
    5. Provide 'partOfSpeech': The grammatical category (e.g., Noun, Verb, Adjective).
    6. Provide exactly 3 'conversationStarters' for the concept.
    7. For the 'story', create a gripping, high-interest micro-fiction (max 100 words) with a twist or strong emotional hook that illustrates the theme. Make it engaging and memorable, not just educational.
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
                  partOfSpeech: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  simpleDefinition: { type: Type.STRING },
                  khmerDefinition: { type: Type.STRING },
                  mnemoLink: { type: Type.STRING },
                  emotionalTrigger: { type: Type.STRING },
                  etymology: { type: Type.STRING },
                  exampleSentences: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 distinct example sentences using the word."
                  },
                },
                required: ["word", "partOfSpeech", "pronunciation", "definition", "simpleDefinition", "khmerDefinition", "mnemoLink", "emotionalTrigger", "etymology", "exampleSentences"]
              }
            },
            concept: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                field: { type: Type.STRING },
                explanation: { type: Type.STRING },
                analogy: { type: Type.STRING },
                conversationStarters: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 3 diverse and engaging hooks to start a conversation about this concept."
                },
              },
              required: ["title", "field", "explanation", "analogy", "conversationStarters"]
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
      throw new Error("Empty response from AI.");
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
    const response = await ai.models.generateContent({ model: modelId, contents: prompt });
    return response.text || "...";
  } catch (e: any) {
    return "Error: " + (e.message || "");
  }
};

export const getSimSuggestion = async (
  history: { role: string; text: string }[], 
  scenario: { setting: string; role: string; objective: string }
): Promise<string> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview";
  const conversation = history.map(h => `${h.role === 'user' ? 'User' : scenario.role}: ${h.text}`).join('\n');
  
  const prompt = `
    Role: Charismatic communication coach.
    Setting: ${scenario.setting}
    Scenario Role: ${scenario.role}
    Objective: ${scenario.objective}
    Conversation so far: ${conversation}

    TASK: Suggest exactly ONE short, natural response for the User. 
    Prefix the suggestion with an impact tag in brackets like [+Gravitas], [+Wit], [+Warmth], [+Directness], or [+Mystery] based on the rhetorical intent.
    Format: [Tag] Suggestion text.
    Output ONLY the formatted suggestion.
  `;

  try {
    const response = await ai.models.generateContent({ model: modelId, contents: prompt });
    return response.text?.trim() || "[+Directness] Tell me more about that.";
  } catch (e: any) {
    return "[+Warmth] I'm listening.";
  }
};

export const getGrammarHint = async (word: string, definition: string, fragments: string[], correctSequence: string[]): Promise<string> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview";
  const prompt = `Hint for "${word}" sequence: ${correctSequence.join(' ')}. Fragments: ${fragments.join(', ')}. One short grammatical hint (max 15 words).`;
  try {
    const response = await ai.models.generateContent({ model: modelId, contents: prompt });
    return response.text || "Try to find the main subject first.";
  } catch (e) {
    return "Think about the structure: Subject + Verb + Object.";
  }
};

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
        throw new Error("Evaluation failed: " + e.message);
    }
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const sanitizedText = text.replace(/[*_#`\[\]()<>]/g, '').trim();
  if (!sanitizedText || sanitizedText.length < 2) return;

  try {
    if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioContext.state === 'suspended') await audioContext.resume();

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
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      audioCache.set(sanitizedText, audioBuffer);
      await playAudioBuffer(audioBuffer, audioContext);
    }
  } catch (error) {
    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    window.speechSynthesis.speak(utterance);
  }
}

async function playAudioBuffer(buffer: AudioBuffer, context: AudioContext) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  return new Promise<void>((resolve) => { source.onended = () => resolve(); });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const alignedBuffer = data.slice().buffer;
  const dataInt16 = new Int16Array(alignedBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}