import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_ID_KEY = 'streak_reminder_id';
const CHANNEL_ID = 'streak_reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '운세 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === 'granted';
}

// 오늘 밤 23:00에 알림 예약 (이미 예약된 게 있으면 교체)
export async function scheduleTonightReminder() {
  await ensureChannel();

  // 기존 알림 취소
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(23, 0, 0, 0);

  // 이미 23시 지났으면 건너뜀
  if (tonight <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔮 오늘의 운세',
      body: '오늘 운세 아직 확인 안 하셨나요? 잠깐 확인해보세요!',
      sound: false,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tonight,
    },
  });
}

// 운세 확인 완료 → 오늘 알림 취소
export async function cancelTodayReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
