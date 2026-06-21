import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

export function SkeletonBox({ style }: { style?: ViewStyle }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.box, style, { opacity: anim }]} />;
}

const s = StyleSheet.create({
  box: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 12 },
});
