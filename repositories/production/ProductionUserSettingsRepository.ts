import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '@/types/userSettings';
import { RepositoryMutationResult } from '../common';
import { UserSettingsRepository } from '../UserSettingsRepository';

const STORAGE_KEY = '@iptv:user_settings';

const createDefaultSettings = (): UserSettings => ({
  id: 'local-user-settings',
  activePlaylistId: undefined,
  ui: {
    theme: 'dark',
    posterDensity: 'large',
    reduceMotion: false,
    showLiveBadges: true,
    homeRowLimit: 25,
  },
  playback: {
    autoplayNextEpisode: true,
    resumeFromLastPosition: true,
    streamQuality: 'auto',
    allowCellularStreaming: true,
  },
  parentalControls: {
    enabled: false,
    hiddenCategoryIds: [],
    blockAdultContent: false,
  },
  sync: {
    autoSyncEnabled: true,
    syncIntervalHours: 12,
    syncOnlyOnWifi: true,
  },
  updatedAt: new Date().toISOString(),
});

export class ProductionUserSettingsRepository implements UserSettingsRepository {
  private cache: UserSettings | null = null;

  private async load(): Promise<UserSettings> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this.cache = raw
        ? { ...createDefaultSettings(), ...JSON.parse(raw) }
        : createDefaultSettings();
    } catch {
      this.cache = createDefaultSettings();
    }
    return this.cache;
  }

  private async persist(settings: UserSettings): Promise<void> {
    this.cache = settings;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  async getSettings(): Promise<UserSettings> {
    return this.load();
  }

  async updateSettings(partial: Partial<UserSettings>): Promise<RepositoryMutationResult> {
    const current = await this.load();
    const updated: UserSettings = { ...current, ...partial, updatedAt: new Date().toISOString() };
    await this.persist(updated);
    return { success: true, updatedAt: updated.updatedAt };
  }

  async resetSettings(): Promise<UserSettings> {
    const defaults = createDefaultSettings();
    await this.persist(defaults);
    return defaults;
  }
}
