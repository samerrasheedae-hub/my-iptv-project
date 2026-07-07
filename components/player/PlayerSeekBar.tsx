import { colors, radius, typography } from '@/design/tokens';
import { SeekThumbnail } from '@/player/types';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressiveImage } from '../images/ProgressiveImage';
import { formatTime } from './format';

interface Props {
  position: number;
  duration: number;
  buffered: number;
  disabled?: boolean;
  thumbnails: SeekThumbnail[];
  onSeek: (seconds: number) => void;
}

export function PlayerSeekBar({ position, duration, buffered, disabled, thumbnails, onSeek }: Props) {
  const [width, setWidth] = useState(1);
  const [preview, setPreview] = useState<{ x: number; seconds: number } | undefined>();
  const progress = duration > 0 ? position / duration : 0;
  const bufferProgress = duration > 0 ? buffered / duration : 0;
  const thumbnail = useMemo(() => thumbnails.reduce<SeekThumbnail | undefined>((best, item) => {
    if (!preview) return best;
    if (!best) return item;
    return Math.abs(item.timeSeconds - preview.seconds) < Math.abs(best.timeSeconds - preview.seconds) ? item : best;
  }, undefined), [preview, thumbnails]);

  const seekFromX = (x: number, commit: boolean) => {
    if (disabled || duration <= 0) return;
    const seconds = Math.max(0, Math.min(duration, (x / width) * duration));
    setPreview({ x: Math.max(0, Math.min(width, x)), seconds });
    if (commit) {
      onSeek(seconds);
      setTimeout(() => setPreview(undefined), 450);
    }
  };

  return (
    <View style={styles.container}>
      {preview ? (
        <View style={[styles.preview, { left: Math.max(0, Math.min(width - 130, preview.x - 65)) }]}>
          {thumbnail ? <ProgressiveImage uri={thumbnail.imageUrl} style={styles.previewImage} /> : <View style={styles.previewImage} />}
          <Text style={styles.previewText}>{formatTime(preview.seconds)}</Text>
        </View>
      ) : null}
      <Pressable
        disabled={disabled}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onPress={(event) => seekFromX(event.nativeEvent.locationX, true)}
        onPressIn={(event) => seekFromX(event.nativeEvent.locationX, false)}
        style={styles.track}
      >
        <View style={[styles.buffer, { width: `${Math.min(bufferProgress * 100, 100)}%` }]} />
        <View style={[styles.progress, { width: `${Math.min(progress * 100, 100)}%` }]} />
        <View style={[styles.thumb, { left: `${Math.min(progress * 100, 100)}%` }]} />
      </Pressable>
      <View style={styles.times}>
        <Text style={styles.time}>{disabled ? 'LIVE' : formatTime(position)}</Text>
        <Text style={styles.time}>{disabled ? 'On now' : formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  track: { height: 28, justifyContent: 'center' },
  buffer: { position: 'absolute', height: 4, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.35)' },
  progress: { position: 'absolute', height: 4, borderRadius: radius.full, backgroundColor: colors.primary },
  thumb: { position: 'absolute', width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  preview: { position: 'absolute', bottom: 42, width: 130, borderRadius: radius.md, backgroundColor: colors.surface, padding: 6, borderWidth: 1, borderColor: colors.border },
  previewImage: { height: 72, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft },
  previewText: { color: colors.text, textAlign: 'center', fontWeight: '900', marginTop: 4, fontSize: typography.caption },
});
