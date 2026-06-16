export type GrowthStage = 'egg' | 'hatchling' | 'juvenile' | 'companion';

export type Mood = 'joyful' | 'content' | 'neutral' | 'down' | 'lonely';

export interface CharacterState {
  schemaVersion: 1;

  stage: GrowthStage;
  stageEnteredAt: string; // YYYY-MM-DD, date the current stage was reached

  affection: number; // 0-100
  totalCareDays: number; // lifetime count of distinct days with >=1 care action, drives growth
  careStreak: number; // consecutive calendar days with >=1 care action

  lastCareDate: string | null; // YYYY-MM-DD, source of truth for neglect calculation
  lastFedDate: string | null; // YYYY-MM-DD, once-per-day cap for feed
  lastPettedDate: string | null; // YYYY-MM-DD, resets petCountToday on rollover
  petCountToday: number; // 0-3+, diminishing-returns counter for pet

  createdAt: string; // ISO timestamp, adoption date — also the basis for "age"
}

export function createInitialCharacterState(today: string, now: string): CharacterState {
  return {
    schemaVersion: 1,
    stage: 'egg',
    stageEnteredAt: today,
    affection: 50,
    totalCareDays: 0,
    careStreak: 0,
    lastCareDate: null,
    lastFedDate: null,
    lastPettedDate: null,
    petCountToday: 0,
    createdAt: now,
  };
}
