import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo, DevicePlatform } from '@/monetization/types';

const KEY = 'premium_iptv_device_info';

const platform = (): DevicePlatform => {
  const os = typeof navigator !== 'undefined' ? navigator.product : undefined;
  if (os === 'ReactNative') return 'unknown';
  return 'unknown';
};

const createId = () => `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export class DeviceStore {
  async getOrCreateDevice(): Promise<DeviceInfo> {
    const raw = await AsyncStorage.getItem(KEY).catch(() => undefined);
    if (raw) {
      try {
        return JSON.parse(raw) as DeviceInfo;
      } catch {
        await AsyncStorage.removeItem(KEY).catch(() => undefined);
      }
    }

    const device: DeviceInfo = {
      id: createId(),
      platform: platform(),
      name: 'Mobile Device',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(device)).catch(() => undefined);
    return device;
  }
}
