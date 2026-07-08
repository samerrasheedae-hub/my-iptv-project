# Premium IPTV UI Shell

A portrait-only Expo Router + TypeScript application focused on a premium streaming-service UI. IPTV streaming, Xtream, account authentication, and real backend features are intentionally not connected yet.

## Current data mode

The app is now connected to a fake local streaming data provider:

- `providers/StreamingDataProvider.tsx` owns the in-memory mock catalog state.
- `data/mockContent.ts` contains the local catalog records and row composition rules.
- Hooks in `hooks/useCatalog.ts` read from the provider instead of a remote service.
- Mock actions behave like a finished app shell: search, My List, Downloads, player resume/progress, save, and download toggles update local state immediately.

No Xtream or IPTV backend integration is present.













## Production build readiness

Expo/EAS production build readiness has been configured:

- Environment-aware `app.config.js`
- EAS build profiles for development, staging, and production
- Android AAB production config
- iOS production build config
- App icon, adaptive icon, splash, and favicon assets
- Production bundle identifiers and versioning
- Empty Android dangerous permissions list
- Production console logging disabled through app loggers

See `docs/production-build-release.md`.

## Monetization and user management

A production-ready monetization/user management module has been added without changing existing UI or IPTV engines:

- User registration/login/logout architecture
- Persistent token session storage
- Backend session validation
- Device registration and multi-device structure
- Free/Premium subscription models
- Grace period and expiration handling
- Backend-driven feature access checks
- Payment provider abstraction for Stripe, Apple IAP, and Google Play

See `docs/monetization-user-management.md`.

## Production readiness

A stability-focused production readiness pass was added without changing architecture or features:

- Global error handling and root error boundary
- Async timeout protection
- Safe fallback states instead of infinite loading
- Persistent cache validation and auto-repair
- Production-aware logging
- Guarded background tasks and fire-and-forget promises
- Skeleton fallback for player loading/buffering
- Basic performance logging hooks

See `docs/production-readiness.md`.

## Performance optimization pass

A production performance pass was added without changing UI design or architecture:

- Cached data remains visible while background refreshes run
- Network request de-duplication
- Unified engine request de-duplication
- Stable provider/category/account cache keys
- Horizontal row `getItemLayout` optimization
- Image failure cooldown and prefetch de-duplication
- Existing category-on-demand memory strategy preserved

See `docs/performance-optimization.md`.

## Unified Media Engine

A provider-neutral Unified Media Engine has been added above Xtream and M3U:

- Single repository interface for future UI integration
- `MediaProvider` abstraction
- `XtreamProvider` and `M3UProvider` routing adapters
- Normalized Channel/Movie/Series/Category models
- Shared unified cache
- Unified search
- Unified home feed

No UI files were changed and existing Xtream/M3U engines remain intact. See `docs/unified-media-engine.md`.

## Real Xtream networking

The Xtream Engine now uses real Xtream Codes `player_api.php` communication inside the existing architecture. It authenticates, loads account info, loads categories, and loads streams only when a category is opened. It never downloads the full playlist and never uses full M3U playlist loading. See `docs/xtream-real-networking.md`.

## Networking layer

A production-ready provider-neutral networking layer has been added:

- `ApiClient`
- `NetworkManager`
- `RequestQueue`
- `ErrorMapper`
- `NetworkRepository`
- Mock transport/endpoints only
- Request/response interceptors
- Retry, timeout, cancellation, auth, logging, offline queueing, recovery drain, and rate limiting

No Xtream or M3U networking is connected. See `docs/networking-layer.md`.

## Premium player

The player route now uses a provider-neutral production player architecture:

- `PlayerController`
- `PlayerRepository`
- `PlaybackEngine` interface
- Mock playback engine
- Reusable player UI components
- Continue Watching integration
- Live/movie/series modes
- Track selectors, seek bar, gestures, screen lock, casting/PiP architecture, and auto-hide controls

No Xtream or M3U playback integration is connected. See `docs/player-architecture.md`.

## Netflix home screen

The home screen is now repository-driven and includes:

- Hero banner
- Continue Watching
- Recently Added
- Trending Now
- Live TV
- Movies
- Series
- Horizontal paginated rows
- Skeleton loading
- Reusable `NetflixHomeRow` component

No Xtream or M3U networking is connected. See `docs/netflix-home.md`.

## Image loading system

The app includes a reusable poster/backdrop image system built on `expo-image`:

- Progressive image loading
- Memory + disk cache policy
- Lazy loading via virtualized lists
- Visible-poster prefetching
- Failed-image retry
- Skeleton/thumbnail/blurhash placeholders
- Blur while loading
- Optimized FlatList settings for thousands of posters

See `docs/image-loading.md` for details.

## Cache system

A production-ready cache abstraction is implemented and wired into repositories:

- Memory cache
- Persistent AsyncStorage cache
- Playlist-scoped cache keys
- TTL expiration
- Stale-while-revalidate reads
- Background refresh on stale reads
- Per-key async locking to prevent refresh stampedes
- Repository integration for home, search, media lists, details, episodes, and downloads

The cache still uses mock loaders only. Xtream and M3U networking remain unimplemented.

## Repository layer

The UI now works through dependency-injected repositories only. The active implementation is mock/in-memory and does not perform networking.

Implemented repository contracts and mock implementations include:

- `PlaylistRepository`
- `XtreamRepository`
- `M3URepository`
- `CacheRepository`
- `MediaCatalogRepository`
- `UserLibraryRepository`
- `UserSettingsRepository`

The repository container is created in `repositories/mock/createMockRepositoryContainer.ts` and injected through `providers/RepositoryProvider.tsx`. Xtream and M3U repositories intentionally return mock data only.

## Included UI

- Modern dark design system with shared tokens
- Netflix-inspired vertical home page
- Hero banner, large posters, horizontal rows
- Bottom tab navigation
- Search, My List, Downloads, Settings screens
- Player placeholder page with interactive mock controls
- Skeleton loading states with realistic local async delays
- Reusable UI components and typed provider/repository contract
- Portrait orientation lock via `app.json`

## Architecture

```text
app/                    Expo Router routes
components/             Reusable UI building blocks
data/mockContent.ts     Local mock streaming catalog
providers/              In-memory local streaming data provider
design/tokens.ts        Colors, spacing, typography, radii, shadows
hooks/                  Data access hooks
services/               Compatibility/future DI entry point
types/                  Shared TypeScript models
```

When backend work begins, replace `StreamingDataProvider` internals with an API/Xtream-backed implementation while keeping screens and reusable components intact.

## Run

```bash
npm install
npm run start
```
