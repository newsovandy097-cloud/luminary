export type Vibe = 'professional' | 'social' | 'intellectual' | 'charisma' | 'leadership' | 'humorous' | 'empathy' | 'negotiation' | 'family' | 'parenting';
export type SkillLevel = 'noob' | 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface Vocabulary {
  word: string;
  pronunciation: string;
  definition: string;
  simpleDefinition: string; // "In plain English"
  etymology: string;
  exampleSentences: string[]; // Changed to array for 3 examples
}

export interface Concept {
  title: string;
  field: string;
  explanation: string;
  analogy: string; // "Think of it like..."
  conversationStarter: string;
}

export interface Simulation {
  setting: string;
  role: string; // The AI's persona
  openingLine: string; // What the AI says first
  objective: string; // What the user should try to do
}

export interface SimulationFeedback {
  score: number;
  feedback: string;
  suggestion: string;
}

export interface Story {
  headline: string;
  body: string;
  keyTakeaway: string;
}

export interface Challenge {
  task: string;
  tip: string;
}

export interface DailyLesson {
  id: string;
  date: string; // Readable date string
  timestamp: number;
  theme: string;
  level: SkillLevel; 
  vibe: Vibe;
  vocabularies: Vocabulary[]; 
  concept: Concept;
  simulation: Simulation;
  story: Story;
  challenge: Challenge;
}

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  LESSON = 'LESSON',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}