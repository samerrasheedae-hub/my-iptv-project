# Premium Player Architecture

The player is implemented as a production-shaped, provider-neutral architecture. It does not connect to Xtream, M3U, or real IPTV streams yet. Current playback uses a mock engine with `mock://` sources so the UI and control architecture can be exercised safely.

## Layers

```text
components/player/*
  -> usePlayerController
  -> PlayerController
  -> PlaybackEngine interface
  -> MockPlaybackEngine now, native/IPTV engine later
```

Data is resolved through:

```text
PlayerController
  -> PlayerRepository
  -> RepositoryBackedPlayerRepository
  -> Existing app repositories
```

The UI never talks directly to Xtream, M3U, stream URLs, parser code, or provider adapters.

## Implemented files

- `player/types.ts`
- `player/PlayerController.ts`
- `player/engine/PlaybackEngine.ts`
- `player/engine/MockPlaybackEngine.ts`
- `player/repositories/PlayerRepository.ts`
- `player/repositories/RepositoryBackedPlayerRepository.ts`
- `player/hooks/usePlayerController.ts`
- `player/hooks/useAutoHideControls.ts`
- `components/player/PremiumPlayer.tsx`
- `components/player/VideoSurface.tsx`
- `components/player/PlayerControlsOverlay.tsx`
- `components/player/PlayerSeekBar.tsx`
- `components/player/PlayerGestureLayer.tsx`
- `components/player/PlayerSelectorSheet.tsx`
- `components/player/PlayerActionButton.tsx`

## Feature architecture

Implemented or architecturally represented:

- Play / pause
- Seek bar
- Thumbnail preview model
- Double-tap seek forward/backward
- Skip Intro marker and action
- Continue Watching persistence
- Resume playback position
- Next episode / previous episode architecture
- Episode selector
- Live TV, movie, and series modes
- Audio track selector
- Subtitle selector
- Subtitle style model
- Playback speed selector
- Aspect ratio selector
- Brightness gesture
- Volume gesture
- Screen lock with unlock affordance
- PiP architecture
- Chromecast architecture
- AirPlay architecture
- Auto-hide controls
- Buffering indicator
- Error/recovery architecture
- Network reconnect recovery action
- Loading animation
- Poster/backdrop before playback
- Back button behavior
- Mini-player architecture

## Future engine swap

The current `MockPlaybackEngine` can be replaced with a real engine that implements `PlaybackEngine`. The UI, hooks, controller, repository, selectors, gestures, and player screen should remain stable.

Examples of future engine responsibilities:

- Resolve and play Xtream/M3U stream URLs supplied by a provider repository.
- Attach native video view.
- Emit real buffering, error, track, and timed metadata events.
- Integrate native PiP, Chromecast, AirPlay, subtitle renderers, and orientation locking.

## Current IPTV status

No Xtream requests, M3U parsing, real stream URL resolution, IPTV playback, or networking have been implemented.
