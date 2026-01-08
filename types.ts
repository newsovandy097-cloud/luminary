export type Vibe = 'professional' | 'social' | 'intellectual' | 'charisma' | 'leadership' | 'humorous' | 'empathy' | 'negotiation' | 'family' | 'parenting';
export type SkillLevel = 'noob' | 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface Vocabulary {
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  definition: string;
  simpleDefinition: string;
  khmerDefinition: string;
  mnemoLink: string;
  emotionalTrigger: string;
  etymology: string;
  exampleSentences: string[];
  srsLevel?: number; // 0-5
  nextReviewDate?: number;
}

export interface Concept {
  title: string;
  field: string;
  explanation: string;
  analogy: string;
  conversationStarters: string[];
}

export interface Simulation {
  setting: string;
  role: string;
  openingLine: string;
  objective: string;
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
  date: string;
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

export interface SkillNode {
  id: string;
  label: string;
  description: string;
  icon: any; // Lucide icon component
  targetVibe: Vibe;
  targetLevel: SkillLevel;
  requiredXp: number; // Cumulative XP needed to unlock (or cost)
  cost: number;
  dependencies: string[]; // IDs of parent nodes
  position: { x: number, y: number }; // Percentage 0-100
}

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  LESSON = 'LESSON',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}