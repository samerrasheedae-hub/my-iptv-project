# Streaming Data Architecture

## Goal

The UI must never talk directly to Xtream Codes, M3U playlists, parser code, networking clients, or provider-specific response shapes. Screens and reusable UI components communicate only with repository interfaces.

## Layers

1. **UI Layer**
   - Expo Router screens and reusable components.
   - Reads compact summaries for rows/search/grids.
   - Requests detail records only for detail/player screens.

2. **Repository Layer**
   - `PlaylistRepository`
   - `MediaCatalogRepository`
   - `UserLibraryRepository`
   - `UserSettingsRepository`
   - Owns pagination, cursors, detail loading, favorites, continue watching, settings, and home composition.

3. **Domain Model Layer**
   - Provider-neutral TypeScript interfaces for playlists, categories, channels, movies, series, episodes, search, favorites, continue watching, and settings.

4. **Provider Adapter Layer**
   - Future Xtream and M3U adapters normalize provider data into domain models.
   - No UI imports provider adapter types.

5. **Storage/Index Layer**
   - Future local database/search index for 100,000+ items.
   - Repositories should page results and return summaries to avoid loading entire catalogs into memory.

## Large catalog strategy

- Use `MediaSummary` for home rows, category grids, and search results.
- Use full `Channel`, `Movie`, `Series`, and `Episode` models only after a user opens a title.
- Use cursor pagination everywhere large collections are possible.
- Keep provider references in `ProviderRef`, isolated from UI behavior.
- Store searchable normalized text in `searchText` and stable sorting in `sortTitle`.

## Backend/IPTV status

This is a design-only architecture. Networking, Xtream Codes API calls, M3U parsing, playable stream URL resolution, and IPTV playback are intentionally not implemented.

## Implemented repository layer

The project now includes a dependency-injected mock repository layer:

- `PlaylistRepository` manages available playlists and the active playlist.
- `XtreamRepository` defines future Xtream catalog access but currently returns mock domain data only.
- `M3URepository` defines future M3U playlist access but currently returns mock domain data only.
- `CacheRepository` provides an in-memory mock cache for offline/download-style state.
- `MediaCatalogRepository` composes provider repositories into UI-ready catalog concepts.
- `UserLibraryRepository` owns favorites and continue-watching state.
- `UserSettingsRepository` owns local mock settings.

The UI is connected through `RepositoryProvider` and hooks in `hooks/useCatalog.ts`. Screens still render the existing Netflix-style interface, but their data now flows through repositories rather than direct mock provider calls.

## Production-ready cache layer

The repository layer now uses a production-oriented cache abstraction while still returning mock data only.

Implemented files:

- `cache/MemoryCacheStore.ts` — fast process memory cache.
- `cache/PersistentCacheStore.ts` — persistent AsyncStorage-backed cache.
- `cache/ProductionCacheRepository.ts` — repository-level cache facade.
- `cache/KeyedAsyncLock.ts` — per-cache-key async locking for thread-safe refreshes.
- `cache/cacheKeys.ts` — playlist-scoped cache key generation.

Implemented behavior:

- Memory cache + persistent cache read-through.
- Cache entries are scoped by `playlistId`.
- TTL expiration using `staleAt` and `expiresAt` timestamps.
- Stale-while-revalidate behavior: stale records are returned immediately while refresh runs in the background.
- Thread-safe refresh: concurrent requests for the same cache key share a per-key lock and do not stampede loaders.
- Repository integration: `MockMediaCatalogRepository` caches home catalog, category lists, media lists, search, detail lookups, and episode lists.
- Downloads/offline UI state is stored through the same cache repository using playlist-scoped keys.

No Xtream requests, M3U fetching, M3U parsing, or IPTV playback were added.
