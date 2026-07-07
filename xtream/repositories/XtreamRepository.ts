import { XtreamEngine } from '@/xtream/engine/XtreamEngine';
import { BackgroundSyncEngine } from '@/xtream/engine/BackgroundSyncEngine';
import {
  XtreamAccountInfo,
  XtreamAuthenticationInput,
  XtreamCategory,
  XtreamCategoryRequest,
  XtreamEngineState,
  XtreamPage,
  XtreamPlaybackSource,
  XtreamSession,
  XtreamStreamResolutionRequest,
  XtreamStreamSummary,
  XtreamStreamsByCategoryRequest,
} from '@/xtream/types';

export interface XtreamRepository {
  authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession>;
  getAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo>;
  listCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>>;
  listStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>>;
  resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource>;
  startBackgroundSync(playlistId: string): void;
  stopBackgroundSync(): void;
  refreshCachedData(playlistId: string): Promise<void>;
  getEngineState(): XtreamEngineState;
  cancelRequests(): void;
}

export class EngineBackedXtreamRepository implements XtreamRepository {
  constructor(
    private readonly engine: XtreamEngine,
    private readonly backgroundSync: BackgroundSyncEngine,
  ) {}

  authenticate(input: XtreamAuthenticationInput): Promise<XtreamSession> {
    return this.engine.authenticate(input);
  }

  getAccountInfo(playlistId: string, signal?: AbortSignal): Promise<XtreamAccountInfo> {
    return this.engine.loadAccountInfo(playlistId, signal);
  }

  listCategories(request: XtreamCategoryRequest): Promise<XtreamPage<XtreamCategory>> {
    return this.engine.loadCategories(request);
  }

  listStreamsByCategory(request: XtreamStreamsByCategoryRequest): Promise<XtreamPage<XtreamStreamSummary>> {
    return this.engine.loadStreamsByCategory(request);
  }


  resolvePlaybackSource(request: XtreamStreamResolutionRequest): Promise<XtreamPlaybackSource> {
    return this.engine.resolvePlaybackSource(request);
  }

  startBackgroundSync(playlistId: string): void {
    this.backgroundSync.start(playlistId);
  }

  stopBackgroundSync(): void {
    this.backgroundSync.stop();
  }

  refreshCachedData(playlistId: string): Promise<void> {
    return this.backgroundSync.runOnce(playlistId);
  }

  getEngineState(): XtreamEngineState {
    return this.engine.getState();
  }

  cancelRequests(): void {
    this.engine.cancelAll();
  }
}
