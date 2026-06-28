import { Platform } from 'react-native';

// Lazy-import so the module fails gracefully when expo-notifications is absent
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (Notifications) return Notifications;
  try {
    Notifications = await import('expo-notifications');
    // Configure how notifications appear while the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  } catch {
    return null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const N = await getNotifications();
  if (!N) return false;

  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendDailyLimitNotification(
  minutesToday: number,
  maxMinutes: number,
  uvIndex: number,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const N = await getNotifications();
  if (!N) return;

  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') return;

  await N.scheduleNotificationAsync({
    content: {
      title: 'Daily UV limit reached',
      body: `You've had ${minutesToday} min of sun today (limit: ${maxMinutes} min at UV ${uvIndex}). Seek shade and reapply SPF 50+.`,
      data: { type: 'uv_daily_limit' },
    },
    trigger: null, // immediate
  });
}

export async function sendSPFReminderNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const N = await getNotifications();
  if (!N) return;

  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') return;

  await N.scheduleNotificationAsync({
    content: {
      title: 'Time to reapply sunscreen',
      body: "It's been 2 hours since you applied SPF. Reapply to stay protected.",
      data: { type: 'spf_reminder' },
    },
    trigger: null,
  });
}
