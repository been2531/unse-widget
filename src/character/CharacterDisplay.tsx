import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import DragonSkia from './DragonSkia';
import type { GrowthStage, Mood } from './types';

// stage별 시각 크기 비율 (egg=작게, elder=크게)
const STAGE_SCALE: Record<GrowthStage, number> = {
  egg:        0.42,
  newborn:    0.52,
  infant:     0.62,
  child:      0.73,
  adolescent: 0.83,
  youngAdult: 0.93,
  elder:      1.00,
};

interface Props {
  stage: GrowthStage;
  mood: Mood;
  size?: number;
}

const FLOAT: Record<Mood, { amplitude: number; duration: number }> = {
  joyful:  { amplitude: 10, duration: 800 },
  neutral: { amplitude: 7,  duration: 2200 },
  lonely:  { amplitude: 3,  duration: 4500 },
};

export default function CharacterDisplay({ stage, mood, size = 240 }: Props) {
  const floatY   = useSharedValue(0);
  const reactS   = useSharedValue(1);
  const reactRot = useSharedValue(0);
  const rotX     = useSharedValue(0);
  const rotY     = useSharedValue(0);

  useEffect(() => {
    const { amplitude, duration } = FLOAT[mood];
    floatY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,           { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, [mood]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      rotY.value = ((e.x / size) - 0.5) * 40;
      rotX.value = -(((e.y / size) - 0.5) * 40);
    })
    .onEnd((e) => {
      'worklet';
      rotX.value = withSpring(0, { damping: 12, stiffness: 140 });
      rotY.value = withSpring(0, { damping: 12, stiffness: 140 });
      if (Math.abs(e.translationX) < 10 && Math.abs(e.translationY) < 10) {
        reactS.value = withSequence(
          withSpring(1.22, { damping: 3, stiffness: 400 }),
          withSpring(1.00, { damping: 8, stiffness: 200 }),
        );
      }
    });

  const stageScale = STAGE_SCALE[stage];

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${rotY.value}deg` },
      { translateY: floatY.value },
      { scale: stageScale * reactS.value },
      { rotate: `${reactRot.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ width: size, height: size }, animStyle]}>
        <DragonSkia mood={mood} size={size} />
      </Animated.View>
    </GestureDetector>
  );
}
