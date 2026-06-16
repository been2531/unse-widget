import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import { CHARACTER_ASSET_MAP } from '@/character/assetMap';
import type { GrowthStage, Mood } from '@/character/types';

export interface FortuneWidgetProps {
  stage: GrowthStage;
  mood: Mood;
  fortuneText: string;
  feedAvailable: boolean;
  // Snapshot text like "2시간 후" computed at render time — the widget is a
  // static bitmap (no running JS timer on the home screen), so it can't
  // tick a live countdown the way the app screen's button does. It just
  // reflects whatever was true the last time the widget was redrawn.
  feedRemainingLabel?: string;
}

// Widget UI must be built from this library's primitives only — it is
// rendered off-screen to a bitmap, not mounted as real RN views.
// The feed button is a separate nested FlexWidget with its own clickAction
// (QUICK_FEED) — the library registers each clickAction'd view as an
// independent tap region, so it doesn't fall through to the root's
// OPEN_APP. Omitting clickAction entirely (feedAvailable === false) leaves
// that region non-clickable, matching the app screen's disabled-button look.
export function FortuneWidget({ stage, mood, fortuneText, feedAvailable, feedRemainingLabel }: FortuneWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
      }}
    >
      <ImageWidget image={CHARACTER_ASSET_MAP[stage][mood]} imageWidth={84} imageHeight={84} />
      <TextWidget
        text={fortuneText}
        truncate="END"
        maxLines={2}
        style={{ fontSize: 13, color: '#333333', textAlign: 'center', marginTop: 6 }}
      />
      <FlexWidget
        clickAction={feedAvailable ? 'QUICK_FEED' : undefined}
        style={{
          marginTop: 8,
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: feedAvailable ? '#4F8EF7' : '#CCCCCC',
        }}
      >
        <TextWidget
          text={feedAvailable ? '먹이 주기' : `먹이 주기 (${feedRemainingLabel ?? '대기 중'})`}
          style={{ fontSize: 12, color: '#FFFFFF' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
