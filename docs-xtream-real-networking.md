# Real Xtream Networking Inside Existing Engine

The existing Xtream architecture is preserved:

```text
UI
 ↓
XtreamRepository
 ↓
XtreamCacheLayer
 ↓
XtreamEngine
 ↓
XtreamService
 ↓
Xtream Codes player_api.php
```

The UI still never communicates directly with Xtream. The UI uses repositories only.

## What changed

Only the Xtream service/networking implementation was replaced. The mock backend calls were removed from `XtreamService` and replaced with real Xtream Codes `player_api.php` requests.

Added:

```text
xtream/services/XtreamFetchTransport.ts
```

Updated:

```text
xtream/services/XtreamService.ts
xtream/cache/XtreamCacheLayer.ts
xtream/engine/XtreamEngine.ts
xtream/createXtreamEngine.ts
xtream/index.ts
```

## Real Xtream endpoints used

Authentication/account info:

```text
/player_api.php?username=...&password=...
```

Categories only:

```text
/player_api.php?action=get_live_categories
/player_api.php?action=get_vod_categories
/player_api.php?action=get_series_categories
```

Category streams only when a category is opened:

```text
/player_api.php?action=get_live_streams&category_id=...
/player_api.php?action=get_vod_streams&category_id=...
/player_api.php?action=get_series&category_id=...
```

## Loading behavior

On authenticate:

1. Authenticate the account.
2. Load account information.
3. Load and cache all live/movie/series categories.
4. Do not load streams.

When a category is opened:

1. Load that category only.
2. Cache that category separately.
3. Return only the requested page to the app UI.
4. Reuse cached category data for future pages and stale-while-revalidate refresh.

## Large account behavior

- The full playlist is never requested.
- `get.php` / full M3U playlist download is never used.
- Streams are never loaded after login.
- Streams are loaded per category only.
- Each category cache is scoped by playlist ID and category ID.
- The cache layer stores the downloaded category separately, then paginates locally to avoid duplicate category requests for every page.
- Request deduplication prevents repeated in-flight requests for the same category.
- Request cancellation is preserved through `AbortSignal`.
- Existing networking retry/timeout/rate limiting remains in use.

## Credential input

`XtreamAuthenticationInput` currently uses:

```ts
serverUrlRef
username
passwordRef
```

For the real networking implementation, `serverUrlRef` and `passwordRef` are consumed by the service boundary. In a production app these values should come from secure storage or a backend-issued credential reference.
