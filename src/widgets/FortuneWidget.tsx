import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import { CHARACTER_ASSET_MAP } from '@/character/assetMap';
import type { GrowthStage, Mood } from '@/character/types';

export interface FortuneWidgetProps {
  stage: GrowthStage;
  mood: Mood;
  fortuneText: string;
}

export function FortuneWidget({ stage, mood, fortuneText }: FortuneWidgetProps) {
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
    </FlexWidget>
  );
}
