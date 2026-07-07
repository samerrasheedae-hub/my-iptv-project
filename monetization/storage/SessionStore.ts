import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo, UserProfile, UserSession, SubscriptionSnapshot } from '@/monetization/types';
import { AppLogger } from '@/stability/AppLogger';

export interface StoredUserState {
  profile?: UserProfile;
  session?: UserSession;
  subscription?: SubscriptionSnapshot;
  device?: DeviceInfo;
  updatedAt: string;
}

export interface SessionStore {
  getState(): Promise<StoredUserState>;
  setState(state: StoredUserState): Promise<void>;
  patchState(state: Partial<StoredUserState>): Promise<StoredUserState>;
  clear(): Promise<void>;
}

const KEY = 'premium_iptv_user_state';

export class AsyncStorageSessionStore implements SessionStore {
  async getState(): Promise<StoredUserState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { updatedAt: new Date().toISOString() };
      const parsed = JSON.parse(raw) as Partial<StoredUserState>;
      if (!parsed || typeof parsed !== 'object') return { updatedAt: new Date().toISOString() };
      return { ...parsed, updatedAt: parsed.updatedAt ?? new Date().toISOString() };
    } catch (error) {
      AppLogger.warn('user_state_corrupted', { error: String(error) });
      await AsyncStorage.removeItem(KEY).catch(() => undefined);
      return { updatedAt: new Date().toISOString() };
    }
  }

  async setState(state: StoredUserState): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(state)).catch((error) => {
      AppLogger.warn('user_state_save_failed', { error: String(error) });
    });
  }

  async patchState(state: Partial<StoredUserState>): Promise<StoredUserState> {
    const current = await this.getState();
    const next = { ...current, ...state, updatedAt: new Date().toISOString() };
    await this.setState(next);
    return next;
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY).catch((error) => {
      AppLogger.warn('user_state_clear_failed', { error: String(error) });
    });
  }
}
