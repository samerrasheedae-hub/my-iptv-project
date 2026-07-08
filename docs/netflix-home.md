# Netflix Home Screen Implementation

The home screen now uses the repository layer end-to-end and does not talk directly to Xtream, M3U, mock source files, or provider adapters.

## Implemented sections

- Hero banner
- Continue Watching
- Recently Added
- Trending Now
- Live TV
- Movies
- Series
- Horizontal rows
- Skeleton loading
- Infinite horizontal row pagination
- Reusable row/component structure

## Data flow

```text
app/(tabs)/index.tsx
  -> useNetflixHome()
  -> RepositoryProvider
  -> MediaCatalogRepository / UserLibraryRepository / CacheRepository
  -> Mock repositories only
```

## New reusable pieces

- `hooks/useNetflixHome.ts`
  - Builds the Netflix-style home model from repositories.
  - Loads hero content.
  - Loads row sections with paginated repository queries.
  - Provides `loadMoreRow` for infinite horizontal scrolling.

- `components/NetflixHomeRow.tsx`
  - Reusable horizontal row component.
  - Supports lazy image prefetching.
  - Supports `onEndReached` pagination.
  - Shows loading skeletons while more row items load.

- `utils/contentMapper.ts`
  - Maps provider-neutral repository domain models into the current UI `ContentItem` view model.

## Infinite scrolling

Rows are loaded with a small page size from `MediaCatalogRepository.listMedia`. When the user scrolls near the end of a horizontal row, `NetflixHomeRow` calls `loadMoreRow`, which requests the next cursor from the repository layer.

## IPTV status

No Xtream networking, M3U parsing, stream playback, or IPTV functionality was implemented. The screen uses repository interfaces with mock repository data only.
