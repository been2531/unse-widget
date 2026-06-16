import { daysBetween, toDateOnly } from '../shared/dateUtils';
import type { CharacterState, GrowthStage } from './types';

const DECAY_PER_NEGLECTED_DAY = 8;
const AFFECTION_FLOOR = 5;
const AFFECTION_CEILING = 100;

const STAGE_ORDER: GrowthStage[] = [
  'egg',
  'newborn',
  'infant',
  'child',
  'adolescent',
  'youngAdult',
  'elder',
];

interface StageThreshold {
  minDaysInStage: number;
  minTotalCareDays: number;
}

// Both elapsed time AND cumulative care-days are required to advance a
// stage — time alone would make care pointless, care-days alone would let
// a single binge day rush through every stage. See plan's growth-rule
// rationale. minTotalCareDays is cumulative across the character's whole
// life, not per-stage — about 53 days minimum to reach elder if cared for
// every single day.
const STAGE_THRESHOLDS: Partial<Record<GrowthStage, StageThreshold>> = {
  egg: { minDaysInStage: 2, minTotalCareDays: 2 },
  newborn: { minDaysInStage: 5, minTotalCareDays: 6 },
  infant: { minDaysInStage: 7, minTotalCareDays: 12 },
  child: { minDaysInStage: 9, minTotalCareDays: 19 },
  adolescent: { minDaysInStage: 12, minTotalCareDays: 28 },
  youngAdult: { minDaysInStage: 18, minTotalCareDays: 40 },
};

// neglectDays is intentionally never persisted — both the widget headless
// handler and the foreground app must derive the same answer from
// lastCareDate alone, independent of when each last happened to run.
export function computeNeglectDays(state: CharacterState, today: string): number {
  const anchor = state.lastCareDate ?? toDateOnly(state.createdAt);
  return Math.max(0, daysBetween(anchor, today) - 1);
}

// affection is persisted "as of lastCareDate" and decay is applied at read
// time, not written back — this keeps the computation idempotent no matter
// how many times it's called on the same day.
export function computeEffectiveAffection(state: CharacterState, today: string): number {
  const neglectDays = computeNeglectDays(state, today);
  const decayed = state.affection - DECAY_PER_NEGLECTED_DAY * neglectDays;
  return Math.max(AFFECTION_FLOOR, Math.min(AFFECTION_CEILING, decayed));
}

export function computeMonthsSinceAdoption(state: CharacterState, today: string): number {
  return Math.max(0, Math.floor(daysBetween(toDateOnly(state.createdAt), today) / 30));
}

// Idempotent: re-running without new elapsed time/care-days just returns
// state unchanged. Called on every read (app foreground, widget update,
// right after a care action) rather than on a separate scheduler.
export function recomputeStage(state: CharacterState, today: string): CharacterState {
  const threshold = STAGE_THRESHOLDS[state.stage];
  if (!threshold) return state; // already at the final stage (elder)

  const daysInStage = daysBetween(state.stageEnteredAt, today);
  const qualifies =
    daysInStage >= threshold.minDaysInStage && state.totalCareDays >= threshold.minTotalCareDays;
  if (!qualifies) return state;

  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(state.stage) + 1];
  return {
    ...state,
    stage: nextStage,
    stageEnteredAt: today,
  };
}
