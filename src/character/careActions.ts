import { daysBetween } from '../shared/dateUtils';
import type { CharacterState } from './types';

const AFFECTION_MAX = 100;
const FEED_GAIN = 15;
const PET_GAINS = [6, 3, 1]; // 1st/2nd/3rd pet of the day; 4th+ is a no-op

function clampAffection(value: number): number {
  return Math.max(0, Math.min(AFFECTION_MAX, value));
}

// Shared bookkeeping run by every care action — lives in one place so feed
// and pet can never drift out of sync on totalCareDays/careStreak/lastCareDate.
function applyCareBookkeeping(state: CharacterState, today: string): CharacterState {
  if (state.lastCareDate === today) return state;
  const isConsecutive = state.lastCareDate !== null && daysBetween(state.lastCareDate, today) === 1;
  return {
    ...state,
    careStreak: isConsecutive ? state.careStreak + 1 : 1,
    totalCareDays: state.totalCareDays + 1,
    lastCareDate: today,
  };
}

export function canFeedToday(state: CharacterState, today: string): boolean {
  return state.lastFedDate !== today;
}

export function applyFeed(state: CharacterState, today: string): CharacterState {
  if (!canFeedToday(state, today)) return state;
  const withBookkeeping = applyCareBookkeeping(state, today);
  return {
    ...withBookkeeping,
    affection: clampAffection(withBookkeeping.affection + FEED_GAIN),
    lastFedDate: today,
  };
}

function petCountForToday(state: CharacterState, today: string): number {
  return state.lastPettedDate === today ? state.petCountToday : 0;
}

export function canPetToday(state: CharacterState, today: string): boolean {
  return petCountForToday(state, today) < PET_GAINS.length;
}

export function applyPet(state: CharacterState, today: string): CharacterState {
  const countToday = petCountForToday(state, today);
  if (countToday >= PET_GAINS.length) return state;
  const withBookkeeping = applyCareBookkeeping(state, today);
  return {
    ...withBookkeeping,
    affection: clampAffection(withBookkeeping.affection + PET_GAINS[countToday]),
    lastPettedDate: today,
    petCountToday: countToday + 1,
  };
}
