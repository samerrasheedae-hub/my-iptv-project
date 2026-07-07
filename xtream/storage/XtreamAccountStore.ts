import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { XtreamAccountInfo, XtreamSession } from '@/xtream/types';
import { AppLogger } from '@/stability/AppLogger';

const ACCOUNT_KEY = 'premium_iptv_xtream_account';
const passwordKey = (playlistId: string) => `premium_iptv_xtream_password:${playlistId}`;

export interface StoredXtreamAccount {
  playlistId: string;
  serverUrl: string;
  username: string;
  session?: XtreamSession;
  account?: XtreamAccountInfo;
  updatedAt: string;
}

export interface StoredXtreamCredentials extends StoredXtreamAccount {
  password: string;
}

export interface XtreamAccountStore {
  getAccount(): Promise<StoredXtreamAccount | undefined>;
  getCredentials(): Promise<StoredXtreamCredentials | undefined>;
  saveCredentials(input: Omit<StoredXtreamCredentials, 'updatedAt'>): Promise<void>;
  clear(): Promise<void>;
}

export class SecureXtreamAccountStore implements XtreamAccountStore {
  async getAccount(): Promise<StoredXtreamAccount | undefined> {
    try {
      const raw = await AsyncStorage.getItem(ACCOUNT_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as Partial<StoredXtreamAccount>;
      if (!parsed.playlistId || !parsed.serverUrl || !parsed.username) return undefined;
      return parsed as StoredXtreamAccount;
    } catch (error) {
      AppLogger.warn('xtream_account_store_read_failed', { error: String(error) });
      await AsyncStorage.removeItem(ACCOUNT_KEY).catch(() => undefined);
      return undefined;
    }
  }

  async getCredentials(): Promise<StoredXtreamCredentials | undefined> {
    const account = await this.getAccount();
    if (!account) return undefined;
    try {
      const password = await SecureStore.getItemAsync(passwordKey(account.playlistId));
      if (!password) return undefined;
      return { ...account, password };
    } catch (error) {
      AppLogger.warn('xtream_secure_password_read_failed', { error: String(error) });
      return undefined;
    }
  }

  async saveCredentials(input: Omit<StoredXtreamCredentials, 'updatedAt'>): Promise<void> {
    const updatedAt = new Date().toISOString();
    const account: StoredXtreamAccount = {
      playlistId: input.playlistId,
      serverUrl: input.serverUrl,
      username: input.username,
      session: input.session,
      account: input.account,
      updatedAt,
    };

    await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    await SecureStore.setItemAsync(passwordKey(input.playlistId), input.password, {
      keychainService: 'premium-iptv-xtream',
    });
  }

  async clear(): Promise<void> {
    const account = await this.getAccount();
    await AsyncStorage.removeItem(ACCOUNT_KEY).catch(() => undefined);
    if (account) await SecureStore.deleteItemAsync(passwordKey(account.playlistId)).catch(() => undefined);
  }
}
