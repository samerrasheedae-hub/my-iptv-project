# Production Xtream Codes Engine

This implementation is **not** a traditional IPTV playlist loader. It is optimized for accounts with more than 100,000 media items and is designed so the mobile app never downloads the full playlist.

## Production architecture

```text
UI
 ↓
XtreamRepository
 ↓
XtreamEngine
 ↓
XtreamCacheLayer
 ↓
XtreamService
 ↓
Backend API
 ↓
Xtream Server
```

The app does not communicate directly with Xtream Codes. `XtreamService` represents the mobile-to-backend boundary. Current service calls use mock backend endpoints only.

## Implemented files

```text
xtream/types.ts
xtream/services/XtreamService.ts
xtream/cache/XtreamCacheLayer.ts
xtream/engine/XtreamEngine.ts
xtream/engine/BackgroundSyncEngine.ts
xtream/repositories/XtreamRepository.ts
xtream/createXtreamEngine.ts
xtream/index.ts
```

## Loading strategy

Implemented flow:

1. Authenticate the user through `XtreamRepository.authenticate`.
2. Download/cache account information only.
3. Download/cache categories only.
4. Do not download streams during authentication or app startup.
5. Download streams only when `listStreamsByCategory` is called for an opened category.
6. Cache each downloaded category page by playlist ID, category ID, content kind, cursor, and limit.
7. Background sync refreshes cached category pages only.
8. UI is never blocked by full playlist loading.

## Large-library strategy

The engine supports very large libraries by design:

- No full playlist download.
- Category-first loading.
- Category stream pages are paginated.
- Mock service simulates categories with thousands of items without materializing the entire category in memory.
- In-flight request deduplication prevents duplicate requests.
- Requests accept cancellation signals.
- Network layer provides retry, queueing, rate limiting, and timeout behavior.
- Cache layer uses memory + persistent cache with TTL and stale-while-revalidate.

## Cache layer

`RepositoryXtreamCacheLayer` wraps the app cache repository and stores:

- Session
- Account info
- Category pages
- Category stream pages
- Cached category index for background sync

Cache entries are playlist-scoped and use TTL + stale-while-revalidate.

## Background sync

`XtreamBackgroundSyncEngine` refreshes:

- Account info
- Category indexes
- Already-cached categories only

It never scans or downloads the full playlist.

## Mock-only status

No real Xtream API requests are implemented. The current service uses mock backend endpoints such as:

```text
/mock/xtream/authenticate
/mock/xtream/account
/mock/xtream/categories
/mock/xtream/category-streams
```

These are mobile-to-backend mock endpoints, not direct Xtream endpoints.

## Real networking update

The mock backend implementation has been replaced with real Xtream Codes `player_api.php` communication inside `XtreamService` while preserving the same repository/engine/cache architecture.

The engine still does not use full playlist loading and never calls `get.php`. It authenticates, loads account info, loads categories, and loads streams only for the category the user opens.
