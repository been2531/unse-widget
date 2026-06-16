import { daysBetween } from '../shared/dateUtils';
import type { CharacterState } from './types';

const AFFECTION_MAX = 100;
const FEED_GAIN = 15;
const PET_GAINS = [6, 3, 1]; // 1st/2nd/3rd pet of the day; 4th+ is a no-op

// Cooldowns replace the old "once per calendar day" cap — the button shows
// a live countdown instead of just going dead until tomorrow, so there's a
// reason to come back into the app more than once a day.
const FEED_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const PET_COOLDOWN_MS = 20 * 60 * 1000;

export interface CareAvailability {
  available: boolean;
  remainingMs: number;
}

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

export function getFeedAvailability(state: CharacterState, nowMs: number): CareAvailability {
  if (!state.lastFedAt) return { available: true, remainingMs: 0 };
  const remaining = FEED_COOLDOWN_MS - (nowMs - new Date(state.lastFedAt).getTime());
  return remaining <= 0 ? { available: true, remainingMs: 0 } : { available: false, remainingMs: remaining };
}

export function applyFeed(state: CharacterState, today: string, nowMs: number): CharacterState {
  if (!getFeedAvailability(state, nowMs).available) return state;
  const withBookkeeping = applyCareBookkeeping(state, today);
  return {
    ...withBookkeeping,
    affection: clampAffection(withBookkeeping.affection + FEED_GAIN),
    lastFedAt: new Date(nowMs).toISOString(),
  };
}

function petCountForToday(state: CharacterState, today: string): number {
  return state.lastPettedDate === today ? state.petCountToday : 0;
}

export interface PetAvailability extends CareAvailability {
  capReached: boolean; // today's diminishing-returns cap (3) hit — distinct from "still on cooldown"
}

export function getPetAvailability(state: CharacterState, today: string, nowMs: number): PetAvailability {
  if (petCountForToday(state, today) >= PET_GAINS.length) {
    return { available: false, remainingMs: 0, capReached: true };
  }
  if (!state.lastPettedAt) return { available: true, remainingMs: 0, capReached: false };
  const remaining = PET_COOLDOWN_MS - (nowMs - new Date(state.lastPettedAt).getTime());
  if (remaining <= 0) return { available: true, remainingMs: 0, capReached: false };
  return { available: false, remainingMs: remaining, capReached: false };
}

export function applyPet(state: CharacterState, today: string, nowMs: number): CharacterState {
  const countToday = petCountForToday(state, today);
  if (!getPetAvailability(state, today, nowMs).available) return state;
  const withBookkeeping = applyCareBookkeeping(state, today);
  return {
    ...withBookkeeping,
    affection: clampAffection(withBookkeeping.affection + PET_GAINS[countToday]),
    lastPettedAt: new Date(nowMs).toISOString(),
    lastPettedDate: today,
    petCountToday: countToday + 1,
  };
}

// "1시간 후" once it's down to whole hours, "12분 후" once under an hour,
// "0:32" mm:ss once under a minute — coarser as the wait is longer since a
// ticking second counter that far out is just noise.
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}시간 ${minutes}분 후`;
  if (minutes > 0) return `${minutes}분 후`;
  return `${seconds}초 후`;
}
