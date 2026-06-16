import type { WidgetTaskHandler, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { applyFeed, formatRemaining, getFeedAvailability } from '@/character/careActions';
import { deriveMood } from '@/character/mood';
import { computeEffectiveAffection, computeNeglectDays } from '@/character/state';
import type { CharacterState } from '@/character/types';
import { deriveValence } from '@/fortune/deriveValence';
import { selectDailyFortune } from '@/fortune/selectFortune';
import { getTodayDateString } from '@/shared/dateUtils';
import { loadCharacterState, saveCharacterState } from '@/storage/characterState';
import { loadUserProfile } from '@/storage/userProfile';

import { FortuneWidget } from './FortuneWidget';

// Exported so scheduleDailyRefresh.ts can reuse the exact same assembly
// logic for the opportunistic (app-foreground) refresh path — there must
// only ever be one place that builds the widget JSX from stored state.
export async function renderCurrentWidgetState() {
  const profile = await loadUserProfile();
  if (!profile) {
    // Onboarding never completed — nothing meaningful to show yet.
    return null;
  }

  const today = getTodayDateString();
  const character = await loadCharacterState();
  const fortune = selectDailyFortune(today, profile.diiSign, profile.starSign);
  const valence = deriveValence(today, profile.diiSign, profile.starSign);

  const neglectDays = computeNeglectDays(character, today);
  const affection = computeEffectiveAffection(character, today);
  const mood = deriveMood({ affection, neglectDays, fortuneValence: valence });
  const feedAvailability = getFeedAvailability(character, Date.now());

  return (
    <FortuneWidget
      stage={character.stage}
      mood={mood}
      fortuneText={fortune.general.text}
      feedAvailable={feedAvailability.available}
      feedRemainingLabel={feedAvailability.available ? undefined : formatRemaining(feedAvailability.remainingMs)}
    />
  );
}

// One render function, called from WIDGET_ADDED / WIDGET_UPDATE / after
// QUICK_FEED — so there's exactly one place that assembles the widget JSX
// (see plan). neglectDays/affection/mood are always recomputed fresh here,
// never trusted from a stale cache, so the widget and the app can never
// disagree for the same stored state.
export const widgetTaskHandler: WidgetTaskHandler = async (props: WidgetTaskHandlerProps) => {
  const { widgetAction, clickAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') return;

  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'QUICK_FEED') {
    // applyFeed is itself gated by getFeedAvailability, so a double-tap (or
    // a stale already-fed widget the user taps before it refreshes) is a
    // no-op rather than double-counting affection.
    const today = getTodayDateString();
    const character = await loadCharacterState();
    const next: CharacterState = applyFeed(character, today, Date.now());
    await saveCharacterState(next);
  }

  const element = await renderCurrentWidgetState();
  if (!element) return;
  renderWidget(element);
};
