import AsyncStorage from '@react-native-async-storage/async-storage';

import { recomputeStage } from '../character/state';
import { createInitialCharacterState } from '../character/types';
import type { CharacterState, GrowthStage } from '../character/types';
import { getTodayDateString } from '../shared/dateUtils';

const STORAGE_KEY = 'unse:characterState';

// Pre-release test installs may still have the old 4-stage names persisted
// — map them onto the nearest point in the new 7-stage scale so loading
// never breaks on an unrecognized `stage` value. stageEnteredAt resets to
// today since the old scale has no equivalent "days in this stage" data.
const STAGE_MIGRATION: Record<string, GrowthStage> = {
  hatchling: 'newborn',
  juvenile: 'adolescent',
  companion: 'youngAdult',
};

const KNOWN_STAGES: GrowthStage[] = ['egg', 'newborn', 'infant', 'child', 'adolescent', 'youngAdult', 'elder'];

function migrateStage(state: CharacterState, today: string): CharacterState {
  if ((KNOWN_STAGES as string[]).includes(state.stage)) return state;
  const migratedStage = STAGE_MIGRATION[state.stage] ?? 'egg';
  return { ...state, stage: migratedStage, stageEnteredAt: today };
}

// Always runs recomputeStage before returning — this is the one place a
// stage-up actually gets detected and persisted, whether triggered by the
// app opening, the widget refreshing, or right after a care action.
export async function loadCharacterState(): Promise<CharacterState> {
  const today = getTodayDateString();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const state: CharacterState = raw
      ? migrateStage(JSON.parse(raw) as CharacterState, today)
      : createInitialCharacterState(today, new Date().toISOString());

    const recomputed = recomputeStage(state, today);
    if (recomputed !== state) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recomputed));
    }
    return recomputed;
  } catch {
    return createInitialCharacterState(today, new Date().toISOString());
  }
}

export async function saveCharacterState(state: CharacterState): Promise<CharacterState> {
  const today = getTodayDateString();
  const recomputed = recomputeStage(state, today);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recomputed));
  return recomputed;
}
