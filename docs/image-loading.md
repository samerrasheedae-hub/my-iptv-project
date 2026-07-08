# Image Loading System

The app now uses a reusable image loading architecture optimized for large streaming catalogs and thousands of posters.

## Components

- `components/images/ProgressiveImage.tsx`
  - Reusable image component for posters, backdrops, hero art, and player art.
  - Supports progressive loading, placeholders, retry, blur while loading, transitions, and memory/disk cache policy.

- `imaging/imageCache.ts`
  - Small in-memory image registry for successful, failed, and in-flight prefetches.
  - Prevents duplicate prefetch work for the same poster URL.
  - Delegates actual image memory/disk caching to `expo-image` with `cachePolicy="memory-disk"`.

- `hooks/useImagePrefetch.ts`
  - Hook for view-aware poster prefetching from lists and rows.

## Behavior

- Progressive image loading through placeholder/blurhash + transition.
- Memory cache through the in-memory registry and `expo-image` memory cache.
- Disk cache through `expo-image` disk cache.
- Lazy loading through virtualized `FlatList` rows/grids.
- Visible poster prefetching using `onViewableItemsChanged`.
- Failed image retry with incremental retry attempts.
- Placeholder support through skeleton fallback, thumbnail fallback, and blurhash.
- Blur while loading using blurred thumbnail/placeholder layers.
- Optimized list settings for large catalogs: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews`.

## Integrated screens/components

- Poster cards now use `ProgressiveImage`.
- Hero banner now uses `ProgressiveImage`.
- Player placeholder artwork now uses `ProgressiveImage`.
- Horizontal content rows prefetch visible posters/backdrops.
- Grid screens prefetch visible posters/backdrops.

## Backend/IPTV status

This image system does not add IPTV, Xtream, M3U, or networking logic. It only optimizes how UI image URLs are loaded and cached.
