# Production Performance Optimization Pass

This pass keeps the existing architecture and UI design intact. It only improves performance, responsiveness, and stability for large IPTV libraries.

## Startup responsiveness

- `useAsyncResource` now keeps existing data visible while refreshes run.
- Initial empty states still use skeleton UI; refreshes no longer clear already-rendered data.
- This pairs with the existing stale-while-revalidate cache so cached data can remain visible while updates happen in the background.

## Network optimization

- Added `RequestDeduplicator`.
- `ApiClient` now deduplicates identical in-flight GET requests.
- Request dedupe is disabled for explicit cancellation signals and can be disabled with `metadata.dedupe = false`.
- Existing retry, timeout, background queue, and rate limiting remain unchanged.

## Unified engine optimization

- `UnifiedMediaEngine` now deduplicates in-flight unified requests.
- Unified cache keys are stable and scoped by operation, provider, playlist, category, query, cursor, and limit.
- Provider-specific requests avoid double-pagination when querying all providers.
- The unified layer continues using provider-specific caches underneath it.

## Rendering optimization

- Horizontal content rows now provide `getItemLayout` for predictable item sizing.
- Existing `FlatList` windowing remains active: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews`.
- This improves scroll performance for very large catalogs and avoids extra measurement work.

## Image optimization

- Visible-only image prefetching remains the strategy.
- Image prefetching now has failure cooldown to avoid repeatedly retrying broken poster/logo URLs.
- Existing memory/disk caching through `expo-image` remains active.
- Existing in-flight image prefetch deduplication remains active.

## Memory safeguards

- No full playlist behavior was added.
- Xtream and M3U streams remain category-on-demand.
- Unified search/home/category APIs route through repositories/providers and do not expose raw provider data to UI.

## Files changed

```text
network/RequestDeduplicator.ts
network/ApiClient.ts
network/index.ts
media/engine/UnifiedMediaEngine.ts
imaging/imageCache.ts
components/NetflixHomeRow.tsx
components/ContentRow.tsx
hooks/useAsyncResource.ts
docs-performance-optimization.md
```
