import { CacheRepository } from './CacheRepository';
import { M3URepository } from './M3URepository';
import { MediaCatalogRepository } from './MediaCatalogRepository';
import { PlaylistRepository } from './PlaylistRepository';
import { UserLibraryRepository } from './UserLibraryRepository';
import { UserSettingsRepository } from './UserSettingsRepository';
import { XtreamRepository } from './XtreamRepository';

export interface RepositoryContainer {
  playlistRepository: PlaylistRepository;
  mediaCatalogRepository: MediaCatalogRepository;
  userLibraryRepository: UserLibraryRepository;
  userSettingsRepository: UserSettingsRepository;
  xtreamRepository: XtreamRepository;
  m3uRepository: M3URepository;
  cacheRepository: CacheRepository;
}

export type RepositoryFactory = (onChange?: () => void) => RepositoryContainer;
