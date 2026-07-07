import AsyncStorage from '@react-native-async-storage/async-storage';
import { M3USourceDescriptor } from '@/m3u/types';
import { AppLogger } from '@/stability/AppLogger';

const SOURCE_KEY = 'premium_iptv_m3u_source';

export interface M3USourceStore {
  getSource(): Promise<M3USourceDescriptor | undefined>;
  saveSource(source: M3USourceDescriptor): Promise<void>;
  clear(): Promise<void>;
}

export class AsyncStorageM3USourceStore implements M3USourceStore {
  async getSource(): Promise<M3USourceDescriptor | undefined> {
    try {
      const raw = await AsyncStorage.getItem(SOURCE_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Partial<M3USourceDescriptor>;
      if (!parsed.playlistId || !parsed.uri || !parsed.kind || !parsed.displayName) return undefined;
      return parsed as M3USourceDescriptor;
    } catch (error) {
      AppLogger.warn('m3u_source_store_read_failed', { error: String(error) });
      await AsyncStorage.removeItem(SOURCE_KEY).catch(() => undefined);
      return undefined;
    }
  }

  async saveSource(source: M3USourceDescriptor): Promise<void> {
    await AsyncStorage.setItem(SOURCE_KEY, JSON.stringify(source)).catch((error) => {
      AppLogger.warn('m3u_source_store_save_failed', { error: String(error) });
    });
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(SOURCE_KEY).catch((error) => {
      AppLogger.warn('m3u_source_store_clear_failed', { error: String(error) });
    });
  }
}
