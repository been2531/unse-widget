export type GrowthStage = 'egg' | 'newborn' | 'infant' | 'child' | 'adolescent' | 'youngAdult' | 'elder';

export type Mood = 'joyful' | 'neutral' | 'lonely';

// Display-only Korean names for the current stage progress indicator in the
// app screen — purely cosmetic, never used as a lookup key elsewhere.
export const STAGE_LABELS_KO: Record<GrowthStage, string> = {
  egg: '알',
  newborn: '신생아',
  infant: '영아',
  child: '유년기',
  adolescent: '청소년기',
  youngAdult: '청년기',
  elder: '노년기',
};

export interface CharacterState {
  schemaVersion: 1;

  stage: GrowthStage;
  stageEnteredAt: string; // YYYY-MM-DD, date the current stage was reached

  affection: number; // 0-100
  totalCareDays: number; // lifetime count of distinct days with >=1 care action, drives growth
  careStreak: number; // consecutive calendar days with >=1 care action

  lastCareDate: string | null; // YYYY-MM-DD, source of truth for neglect calculation

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
    createdAt: now,
  };
}
