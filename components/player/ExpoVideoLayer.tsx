import { ResizeMode, Video } from 'expo-av';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { getExpoVideoEngine } from '@/player/engine/ExpoVideoPlaybackEngine';
import { PlaybackEngine } from '@/player/engine/PlaybackEngine';
import { AspectRatioMode } from '@/player/types';

const resizeModeFor = (mode: AspectRatioMode): ResizeMode => {
  switch (mode) {
    case 'fill':
    case 'stretch':
      return ResizeMode.STRETCH;
    case 'zoom':
      return ResizeMode.COVER;
    case 'fit':
    default:
      return ResizeMode.CONTAIN;
  }
};

export function ExpoVideoLayer({ engine, aspectRatio }: { engine?: PlaybackEngine; aspectRatio: AspectRatioMode }) {
  const videoEngine = getExpoVideoEngine(engine);
  const attach = useCallback((ref: Video | null) => {
    videoEngine?.attachVideo(ref);
  }, [videoEngine]);

  if (!videoEngine) return null;

  return (
    <Video
      ref={attach}
      style={StyleSheet.absoluteFillObject}
      resizeMode={resizeModeFor(aspectRatio)}
      useNativeControls={false}
      shouldPlay={false}
    />
  );
}
