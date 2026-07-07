import { UserSettings } from '@/types/userSettings';
import { RepositoryMutationResult } from './common';

export interface UserSettingsRepository {
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<RepositoryMutationResult>;
  resetSettings(): Promise<UserSettings>;
}
