# Unified Media Engine

The Unified Media Engine sits above the existing Xtream Engine and M3U Engine without replacing or breaking either one.

## Architecture

```text
UI / future UI hooks
 ↓
UnifiedMediaRepository
 ↓
UnifiedMediaEngine
 ↓
MediaProvider abstraction
 ↓
XtreamProvider / M3UProvider
 ↓
Existing Xtream Engine / Existing M3U Engine
```

The UI can use one interface and does not need to know whether content came from Xtream or M3U.

## Implemented files

```text
media/types.ts
media/providers/MediaProvider.ts
media/providers/XtreamProvider.ts
media/providers/M3UProvider.ts
media/cache/UnifiedMediaCache.ts
media/engine/UnifiedMediaEngine.ts
media/repositories/UnifiedMediaRepository.ts
media/createUnifiedMediaEngine.ts
media/index.ts
```

## Normalized data

Provider-specific data is normalized into:

- `UnifiedCategory`
- `UnifiedChannel`
- `UnifiedMovie`
- `UnifiedSeries`
- `UnifiedMediaItem`

The normalized models contain a `provider` reference so playback/source resolution can still route back to the correct provider later without exposing source details to UI.

## Provider routing

Routing is handled by the `MediaProvider` abstraction.

- `XtreamProvider` wraps the existing `XtreamRepository`.
- `M3UProvider` wraps the existing `M3URepository`.

The Unified Engine chooses the provider by `providerKind` when a specific category is opened, or queries all registered providers for unified categories/search/home feed.

## Shared cache

The unified layer adds a shared cache above both providers:

- `unified-categories`
- `unified-media`
- `unified-search`
- `unified-home`

The existing provider-specific caches remain untouched.

## Unified search

Unified search queries all registered providers, normalizes results, deduplicates by unified ID, and returns a single paginated result.

## Unified home feed

The home feed combines rows from all registered providers into one `UnifiedHomeFeed`.

## Important constraints

- No UI files were changed.
- Xtream Engine was not modified.
- M3U Engine was not modified.
- Provider-specific logic remains inside provider adapters.
- The unified layer does not parse M3U or communicate directly with Xtream.
