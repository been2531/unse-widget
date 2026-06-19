import type { WidgetTaskHandler, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { deriveMood } from '@/character/mood';
import { computeEffectiveAffection, computeNeglectDays } from '@/character/state';
import { deriveValence } from '@/fortune/deriveValence';
import { selectDailyFortune } from '@/fortune/selectFortune';
import { getTodayDateString } from '@/shared/dateUtils';
import { loadCharacterState } from '@/storage/characterState';
import { loadUserProfile } from '@/storage/userProfile';

import { FortuneWidget } from './FortuneWidget';

// Exported so scheduleDailyRefresh.ts can reuse the exact same assembly
// logic for the opportunistic (app-foreground) refresh path — there must
// only ever be one place that builds the widget JSX from stored state.
export async function renderCurrentWidgetState() {
  const profile = await loadUserProfile();
  if (!profile) return null;

  const today = getTodayDateString();
  const character = await loadCharacterState();
  const fortune = selectDailyFortune(today, profile.diiSign, profile.starSign);
  const valence = deriveValence(today, profile.diiSign, profile.starSign);

  const neglectDays = computeNeglectDays(character, today);
  const affection = computeEffectiveAffection(character, today);
  const mood = deriveMood({ affection, neglectDays, fortuneValence: valence });

  return (
    <FortuneWidget
      stage={character.stage}
      mood={mood}
      fortuneText={fortune.general.text}
    />
  );
}

export const widgetTaskHandler: WidgetTaskHandler = async (props: WidgetTaskHandlerProps) => {
  const { widgetAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') return;

  const element = await renderCurrentWidgetState();
  if (!element) return;
  renderWidget(element);
};
