# Production M3U Playlist Engine

This engine follows the same architecture principles as the Xtream Engine, but is dedicated to M3U playlist sources.

## Architecture

```text
UI
 ↓
M3URepository
 ↓
M3UCacheLayer
 ↓
M3UEngine
 ↓
M3UService
 ↓
Backend API
 ↓
M3U Source URL/File
```

The UI never receives raw M3U files and never parses M3U content. The UI receives only structured repository data.

## Implemented files

```text
m3u/types.ts
m3u/parser/IncrementalM3UParser.ts
m3u/parser/M3UStreamMapper.ts
m3u/services/M3UService.ts
m3u/cache/M3UCacheLayer.ts
m3u/engine/M3UEngine.ts
m3u/engine/BackgroundM3UParsingWorker.ts
m3u/repositories/M3URepository.ts
m3u/createM3UEngine.ts
m3u/index.ts
```

## Loading strategy

1. Register a remote URL or local file descriptor.
2. The service/backend indexes categories incrementally.
3. The engine caches category pages.
4. Streams are not loaded during source registration.
5. Streams are loaded only when a category is selected.
6. Category stream pages are cached separately by playlist ID and category ID.
7. Background worker refreshes the source status, category index, and already-cached categories only.

## Incremental parser

`IncrementalM3UParser` processes an `AsyncIterable<string>` chunk stream. It does not require the full M3U file in memory.

It extracts:

- `#EXTINF` title
- `tvg-id`
- `tvg-name`
- `tvg-logo`
- `group-title`
- stream URL
- catchup attributes

It emits structured entries one by one through callbacks.

## Scalability

Designed for 100,000+ playlist items:

- No raw M3U is passed to UI.
- No full playlist is loaded in UI memory.
- Category index is separated from category streams.
- Category streams are requested/cached per category.
- In-flight request deduplication prevents duplicated loads.
- Existing network layer provides retry, timeout, cancellation, queueing, and rate limiting.
- Existing cache layer provides memory cache, persistent cache, TTL, and stale-while-revalidate.

## Remote URL and local file support

`M3USourceDescriptor` supports:

- `remote_url`
- `local_file`

The current service is backend-facing. A production backend can stream-parse remote URLs/files and return structured category/category-stream responses. A local worker can also use `IncrementalM3UParser` with a chunk reader without changing UI or repository contracts.
