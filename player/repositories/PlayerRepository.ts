import { PlayerMediaSession } from '@/player/types';

export interface PlayerRepository {
  getMediaSession(mediaId: string): Promise<PlayerMediaSession | undefined>;
  saveProgress(mediaId: string, positionSeconds: number, durationSeconds: number): Promise<void>;
  clearProgress(mediaId: string): Promise<void>;
}
