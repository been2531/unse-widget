import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { saveUserProfile } from '@/storage/userProfile';
import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

export default function OnboardingScreen() {
  const router = useRouter();
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [error, setError] = useState('');

  function isValid(y: number, m: number, d: number): boolean {
    if (!y || !m || !d) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    return true;
  }

  async function handleSubmit() {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!isValid(y, m, d)) {
      setError('생년월일을 다시 확인해주세요.');
      return;
    }
    const birthdate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    await saveUserProfile(birthdate);
    await refreshFortuneWidget();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>생년월일을 알려주세요</Text>
      <Text style={styles.subtitle}>오늘의 운세와 캐릭터를 준비할게요</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="YYYY"
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={setYear}
        />
        <TextInput
          style={styles.input}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          value={month}
          onChangeText={setMonth}
        />
        <TextInput
          style={styles.input}
          placeholder="DD"
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={setDay}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>시작하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  error: { color: '#e0524d', fontSize: 13 },
  submitButton: { backgroundColor: '#4f8ef7', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, marginTop: 8 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
