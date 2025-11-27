
export enum SkinId {
  DEFAULT = 'default',
}

export interface Skin {
  id: SkinId;
  name: string;
  description: string;
  pixelMap: string[][]; // Hex codes grid
}

export interface Question {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE';
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface NoteData {
  id: string;
  content: string;
  summary: string;
  timestamp: number;
}

export interface PlayerState {
  currentSkin: SkinId;
  highScore: number;
  xp: number;
  level: number;
}