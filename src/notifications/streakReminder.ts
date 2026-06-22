import { NativeModules, Platform } from 'react-native';

const CHANNEL_ID = 'streak_reminder';

// 네이티브 모듈이 링크되지 않은 환경(Expo Go, notifications 미포함 빌드)에서 전체 no-op
const HAS_NATIVE = !!NativeModules.ExpoPushTokenManager;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _n: any = null;
function notif() {
  if (!HAS_NATIVE) return {};
  if (!_n) try { _n = require('expo-notifications'); } catch { _n = {}; }
  return _n;
}

// setNotificationHandler는 모듈 로드 시점에 실행되면 안 되므로 lazy 호출
let _handlerSet = false;
function ensureHandler() {
  if (_handlerSet) return;
  const n = notif();
  if (!n?.setNotificationHandler) return;
  n.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  _handlerSet = true;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  const n = notif();
  if (!n?.setNotificationChannelAsync) return;
  await n.setNotificationChannelAsync(CHANNEL_ID, {
    name: '운세 알림',
    importance: n.AndroidImportance?.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const n = notif();
  if (!n?.getPermissionsAsync) return false;
  const { status } = await n.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await n.requestPermissionsAsync();
  return newStatus === 'granted';
}

// 오늘 밤 23:00에 알림 예약 (이미 예약된 게 있으면 교체)
export async function scheduleTonightReminder() {
  ensureHandler();
  const n = notif();
  if (!n?.scheduleNotificationAsync) return;

  await ensureChannel();
  await n.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(23, 0, 0, 0);

  if (tonight <= now) return;

  await n.scheduleNotificationAsync({
    content: {
      title: '🔮 오늘의 운세',
      body: '오늘 운세 아직 확인 안 하셨나요? 잠깐 확인해보세요!',
      sound: false,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: n.SchedulableTriggerInputTypes?.DATE,
      date: tonight,
    },
  });
}

// 운세 확인 완료 → 오늘 알림 취소
export async function cancelTodayReminder() {
  const n = notif();
  if (!n?.cancelAllScheduledNotificationsAsync) return;
  await n.cancelAllScheduledNotificationsAsync();
}
