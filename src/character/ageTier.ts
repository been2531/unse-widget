// Cosmetic-only progression layered on top of the final (companion) growth
// stage — see plan's "동반자 나이" section. Deliberately months-based, not
// years, and deliberately small (4 tiers) since each tier needs its own
// accessory overlay asset.
export type AgeTier = 0 | 1 | 2 | 3;

const TIER_BOUNDARIES_MONTHS = [6, 12, 18]; // tier0: 0-5mo, tier1: 6-11mo, tier2: 12-17mo, tier3: 18mo+

export function computeAgeTier(monthsSinceAdoption: number): AgeTier {
  if (monthsSinceAdoption < TIER_BOUNDARIES_MONTHS[0]) return 0;
  if (monthsSinceAdoption < TIER_BOUNDARIES_MONTHS[1]) return 1;
  if (monthsSinceAdoption < TIER_BOUNDARIES_MONTHS[2]) return 2;
  return 3;
}
