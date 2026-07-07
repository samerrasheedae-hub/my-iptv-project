import { PlaybackEngine, PlaybackEngineFactory } from '@/player/engine/PlaybackEngine';
import { PlayerRepository } from '@/player/repositories/PlayerRepository';
import { safeFireAndForget } from '@/stability/safeFireAndForget';
import { AspectRatioMode, CastTarget, MediaTrack, PlayerMediaSession, PlayerState, SubtitleStyle } from '@/player/types';

export type PlayerControllerListener = (state: PlayerState) => void;

export class PlayerController {
  private engine?: PlaybackEngine;
  private session?: PlayerMediaSession;
  private listeners = new Set<PlayerControllerListener>();
  private progressTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly mediaId: string,
    private readonly repository: PlayerRepository,
    private readonly engineFactory: PlaybackEngineFactory,
  ) {}

  async initialize() {
    this.session = await this.repository.getMediaSession(this.mediaId);
    if (!this.session) throw new Error('Media session not found');
    this.engine = this.engineFactory.create(this.session.audioTracks, this.session.subtitleTracks, this.session.subtitleStyle);
    this.engine.subscribe({
      onStateChange: (state) => this.emit(state),
      onEnded: () => safeFireAndForget(this.handleEnded(), 'player_handle_ended'),
      onError: () => undefined,
    });
    await this.engine.load(this.session.source, this.session.resumePositionSeconds);
    this.startProgressPersistence();
  }

  getSession() {
    return this.session;
  }

  getState() {
    return this.engine?.getState();
  }

  getEngine() {
    return this.engine;
  }

  subscribe(listener: PlayerControllerListener) {
    this.listeners.add(listener);
    const state = this.getState();
    if (state) listener(state);
    return () => this.listeners.delete(listener);
  }

  async playPause() {
    const state = this.requireEngine().getState();
    if (state.isPlaying) await this.requireEngine().pause();
    else await this.requireEngine().play();
  }

  play() { return this.requireEngine().play(); }
  pause() { return this.requireEngine().pause(); }
  seek(positionSeconds: number) { return this.requireEngine().seek(positionSeconds); }
  seekBy(deltaSeconds: number) { return this.requireEngine().seekBy(deltaSeconds); }
  skipIntro() { return this.session?.skipIntro ? this.seek(this.session.skipIntro.endSeconds) : Promise.resolve(); }
  previousEpisode() { return this.navigateEpisode(this.session?.previousEpisode?.id); }
  nextEpisode() { return this.navigateEpisode(this.session?.nextEpisode?.id); }
  selectEpisode(id: string) { return this.navigateEpisode(id); }
  selectAudioTrack(trackId?: string) { return this.requireEngine().selectAudioTrack(trackId); }
  selectSubtitleTrack(trackId?: string) { return this.requireEngine().selectSubtitleTrack(trackId === 'sub-off' ? undefined : trackId); }
  setSubtitleStyle(style: SubtitleStyle) { return this.requireEngine().setSubtitleStyle(style); }
  setPlaybackSpeed(speed: number) { return this.requireEngine().setPlaybackSpeed(speed); }
  setAspectRatio(mode: AspectRatioMode) { return this.requireEngine().setAspectRatio(mode); }
  setVolume(value: number) { return this.requireEngine().setVolume(value); }
  setBrightness(value: number) { return this.requireEngine().setBrightness(value); }
  setFullscreen(enabled: boolean) { return this.requireEngine().setFullscreen(enabled); }
  toggleLock() { const state = this.requireEngine().getState(); return this.requireEngine().setLocked(!state.isLocked); }
  recover() { return this.requireEngine().recover(); }

  async startCast(target: CastTarget) {
    // Architecture boundary for PiP / Chromecast / AirPlay. Real platform adapters will attach here.
    return { success: true, message: `${target} route prepared` };
  }

  async enterMiniPlayer() {
    return { success: true, message: 'Mini player session prepared' };
  }

  async destroy() {
    if (this.progressTimer) clearInterval(this.progressTimer);
    await this.persistProgress();
    await this.engine?.unload();
    this.listeners.clear();
  }

  private async navigateEpisode(id?: string) {
    if (!id) return;
    await this.persistProgress();
    // Episode navigation architecture is explicit; current mock session keeps the same route-level media shell.
  }

  private async handleEnded() {
    if (!this.session) return;
    await this.repository.clearProgress(this.session.source.id);
  }

  private startProgressPersistence() {
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = setInterval(() => safeFireAndForget(this.persistProgress(), 'player_progress_persist'), 5000);
  }

  private async persistProgress() {
    const state = this.engine?.getState();
    const session = this.session;
    if (!state || !session || state.isLive || state.durationSeconds <= 0) return;
    await this.repository.saveProgress(session.source.id, Math.round(state.positionSeconds), Math.round(state.durationSeconds));
  }

  private emit(state: PlayerState) {
    this.listeners.forEach((listener) => listener(state));
  }

  private requireEngine() {
    if (!this.engine) throw new Error('PlayerController is not initialized');
    return this.engine;
  }
}
