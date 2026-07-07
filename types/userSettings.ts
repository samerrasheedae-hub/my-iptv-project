export type ThemePreference = 'system' | 'dark' | 'light';
export type PosterDensity = 'comfortable' | 'compact' | 'large';
export type StreamQualityPreference = 'auto' | 'low' | 'medium' | 'high' | 'original';

export interface ParentalControlSettings {
  enabled: boolean;
  pinHash?: string;
  hiddenCategoryIds: string[];
  blockAdultContent: boolean;
  maxMaturityRating?: string;
}

export interface PlaybackSettings {
  autoplayNextEpisode: boolean;
  resumeFromLastPosition: boolean;
  preferredAudioLanguage?: string;
  preferredSubtitleLanguage?: string;
  streamQuality: StreamQualityPreference;
  allowCellularStreaming: boolean;
}

export interface UiSettings {
  theme: ThemePreference;
  posterDensity: PosterDensity;
  reduceMotion: boolean;
  showLiveBadges: boolean;
  homeRowLimit: number;
}

export interface SyncSettings {
  autoSyncEnabled: boolean;
  syncIntervalHours: number;
  syncOnlyOnWifi: boolean;
}

export interface UserSettings {
  id: string;
  activePlaylistId?: string;
  ui: UiSettings;
  playback: PlaybackSettings;
  parentalControls: ParentalControlSettings;
  sync: SyncSettings;
  updatedAt: string;
}
