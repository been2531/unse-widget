import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert, Animated, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { F } from '@/shared/fonts';
import { saveUserProfile } from '@/storage/userProfile';
import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

const SLIDES = [
  {
    icon: '✦',
    title: '매일 운명이\n카드로 도착합니다',
    body: '당신의 별자리와 띠를 기반으로\n오늘의 운세가 TCG 카드로 펼쳐집니다',
    accentColor: '#FFD700',
  },
  {
    icon: '📚',
    title: '수집하고\n나만의 덱을 완성하세요',
    body: '재물·연애·건강·직장 운세를 해금하고\n한국 신화 캐릭터 카드를 모아보세요',
    accentColor: '#88AAFF',
  },
  {
    icon: '🎁',
    title: '생년월일을\n알려주세요',
    body: '정확한 운세를 위해 생년월일이 필요합니다\n개인 정보는 기기 내에만 저장됩니다',
    accentColor: '#44DD88',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  const slideA = useRef(new Animated.Value(0)).current;

  const [year, setYear]   = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay]     = useState('');
  const [error, setError] = useState('');

  const monthRef = useRef<TextInput>(null);
  const dayRef   = useRef<TextInput>(null);

  function transitionTo(next: number) {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideA, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideA.setValue(30);
      Animated.parallel([
        Animated.timing(fadeA,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideA, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }

  function isValid(y: number, m: number, d: number): boolean {
    if (!y || !m || !d) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    return true;
  }

  async function handleSubmit() {
    const y = Number(year), m = Number(month), d = Number(day);
    if (!isValid(y, m, d)) {
      setError('생년월일을 다시 확인해주세요.');
      return;
    }
    Keyboard.dismiss();
    const birthdate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    try {
      await saveUserProfile(birthdate);
      await refreshFortuneWidget();
      router.replace('/');
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  }

  const slide = SLIDES[step];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#080B18" />

      {/* 별 필드 장식 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_POS.map((s, i) => (
          <View key={i} style={[styles.star, { left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, opacity: s.a }]} />
        ))}
      </View>

      {/* 슬라이드 콘텐츠 */}
      <Animated.View style={[styles.content, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
        {/* 아이콘 */}
        <View style={[styles.iconCircle, { borderColor: `${slide.accentColor}44`, backgroundColor: `${slide.accentColor}14` }]}>
          <Text style={styles.iconText}>{slide.icon}</Text>
        </View>

        {/* 텍스트 */}
        <Text style={[styles.title, { color: slide.accentColor }]}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        {/* 생년월일 입력 — 마지막 단계만 */}
        {step === 2 && (
          <View style={styles.inputArea}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="YYYY"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={4}
                value={year}
                returnKeyType="next"
                onSubmitEditing={() => monthRef.current?.focus()}
                onChangeText={t => {
                  setYear(t);
                  setError('');
                  if (t.length === 4) monthRef.current?.focus();
                }}
              />
              <TextInput
                ref={monthRef}
                style={styles.input}
                placeholder="MM"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={2}
                value={month}
                returnKeyType="next"
                onSubmitEditing={() => dayRef.current?.focus()}
                onChangeText={t => {
                  setMonth(t);
                  setError('');
                  if (t.length === 2) dayRef.current?.focus();
                }}
              />
              <TextInput
                ref={dayRef}
                style={styles.input}
                placeholder="DD"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={2}
                value={day}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                onChangeText={t => { setDay(t); setError(''); }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}
      </Animated.View>

      {/* 점 내비게이션 */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i === step && { backgroundColor: slide.accentColor }]} />
        ))}
      </View>

      {/* 액션 버튼 */}
      <View style={styles.btnArea}>
        {step < 2 ? (
          <Pressable style={[styles.nextBtn, { borderColor: `${slide.accentColor}66`, shadowColor: slide.accentColor }]}
            onPress={() => transitionTo(step + 1)}>
            <Text style={[styles.nextBtnText, { color: slide.accentColor }]}>다음 →</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.submitBtn, { borderColor: `${slide.accentColor}88`, shadowColor: slide.accentColor }]}
            onPress={handleSubmit}>
            <Text style={[styles.submitBtnText, { color: slide.accentColor }]}>✦ 시작하기</Text>
          </Pressable>
        )}
        {step > 0 && (
          <Pressable onPress={() => transitionTo(step - 1)} style={styles.backLink}>
            <Text style={styles.backLinkText}>← 이전</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// 정적 별 위치 (매 렌더마다 변하지 않도록)
const STAR_POS = Array.from({ length: 55 }, (_, i) => ({
  x: (i * 137 + 29) % 390,
  y: (i * 211 + 71) % 844,
  r: 0.8 + (i % 4) * 0.5,
  a: 0.08 + (i % 6) * 0.05,
}));

const styles = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: '#080B18',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  star: { position: 'absolute', borderRadius: 99, backgroundColor: '#FFFFFF' },
  content: { alignItems: 'center', gap: 20, width: '100%' },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: { fontSize: 38 },
  title: {
    fontFamily: F.bk,
    fontSize: 26, textAlign: 'center',
    lineHeight: 34, letterSpacing: 0.3,
  },
  body: {
    fontFamily: F.r,
    fontSize: 15, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 24,
  },
  inputArea: { width: '100%', gap: 10, marginTop: 8 },
  inputRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  input: {
    fontFamily: F.r,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10,
    fontSize: 16, color: '#FFFFFF', textAlign: 'center', width: 82,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  errorText: { fontFamily: F.r, color: '#FF6B9D', fontSize: 13, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { width: 20, height: 6, borderRadius: 3 },
  btnArea: { width: '100%', marginTop: 24, alignItems: 'center', gap: 14 },
  nextBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 28,
    borderWidth: 1.5, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  nextBtnText: { fontFamily: F.eb, fontSize: 16, letterSpacing: 0.4 },
  submitBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 28,
    borderWidth: 1.5, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  submitBtnText: { fontFamily: F.eb, fontSize: 16, letterSpacing: 0.4 },
  backLink: { paddingVertical: 4 },
  backLinkText: { fontFamily: F.r, color: 'rgba(255,255,255,0.30)', fontSize: 14 },
});
