import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'uv_device_id';

let cached: string | null = null;

function generateId(): string {
  // Simple UUID v4 without external dependencies
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  if (Platform.OS !== 'web') {
    try {
      const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (stored) { cached = stored; return stored; }

      const id = generateId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
      cached = id;
      return id;
    } catch {
      // fall through to in-memory
    }
  }

  cached = cached ?? generateId();
  return cached;
}

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** UV index → safe unprotected exposure minutes (skin type III average) */
export function calcMaxSafeMinutes(uvIndex: number): number {
  if (uvIndex <= 0) return 480;
  return Math.min(480, Math.round(200 / uvIndex));
}
