import { UserSettings } from '@/types/userSettings';
import { RepositoryMutationResult } from '../common';
import { UserSettingsRepository } from '../UserSettingsRepository';
import { XTREAM_PLAYLIST_ID } from './mockDomainData';
import { wait } from './paging';

const createDefaultSettings = (): UserSettings => ({
  id: 'local-user-settings',
  activePlaylistId: XTREAM_PLAYLIST_ID,
  ui: { theme: 'dark', posterDensity: 'large', reduceMotion: false, showLiveBadges: true, homeRowLimit: 25 },
  playback: { autoplayNextEpisode: true, resumeFromLastPosition: true, streamQuality: 'auto', allowCellularStreaming: true },
  parentalControls: { enabled: false, hiddenCategoryIds: [], blockAdultContent: false },
  sync: { autoSyncEnabled: true, syncIntervalHours: 12, syncOnlyOnWifi: true },
  updatedAt: new Date().toISOString(),
});

export class MockUserSettingsRepository implements UserSettingsRepository {
  private settings = createDefaultSettings();

  async getSettings(): Promise<UserSettings> {
    await wait(60);
    return this.settings;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<RepositoryMutationResult> {
    await wait(60);
    this.settings = { ...this.settings, ...settings, updatedAt: new Date().toISOString() };
    return { success: true, updatedAt: this.settings.updatedAt };
  }

  async resetSettings(): Promise<UserSettings> {
    await wait(60);
    this.settings = createDefaultSettings();
    return this.settings;
  }
}
