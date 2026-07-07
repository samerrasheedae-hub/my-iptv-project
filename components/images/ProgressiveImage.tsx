import { Skeleton } from '@/components/Skeleton';
import { colors, radius } from '@/design/tokens';
import { imageMemoryCache, ImageCachePolicy } from '@/imaging/imageCache';
import { Image, ImageContentFit } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';

const DEFAULT_BLURHASH = 'L02rsVWB00WB~qj[WBj[00t7?bof';

interface ProgressiveImageProps {
  uri?: string;
  thumbnailUri?: string;
  blurhash?: string;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  cachePolicy?: Exclude<ImageCachePolicy, 'none'>;
  retryCount?: number;
  retryDelayMs?: number;
  lazy?: boolean;
  recyclingKey?: string;
  accessibilityLabel?: string;
}

const retryUri = (uri: string, attempt: number) => {
  if (attempt === 0) return uri;
  return `${uri}${uri.includes('?') ? '&' : '?'}imageRetry=${attempt}`;
};

export function ProgressiveImage({
  uri,
  thumbnailUri,
  blurhash = DEFAULT_BLURHASH,
  contentFit = 'cover',
  style,
  imageStyle,
  placeholderStyle,
  cachePolicy = 'memory-disk',
  retryCount = 2,
  retryDelayMs = 650,
  lazy = true,
  recyclingKey,
  accessibilityLabel,
}: ProgressiveImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(() => imageMemoryCache.has(uri));
  const [failed, setFailed] = useState(false);
  const opacity = useRef(new Animated.Value(loaded ? 1 : 0)).current;

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    setLoaded(imageMemoryCache.has(uri));
    opacity.setValue(imageMemoryCache.has(uri) ? 1 : 0);
  }, [opacity, uri]);

  useEffect(() => {
    if (!uri || !lazy) return;
    void imageMemoryCache.prefetch(uri, { cachePolicy });
  }, [cachePolicy, lazy, uri]);

  const source = useMemo(() => (uri ? { uri: retryUri(uri, attempt) } : undefined), [attempt, uri]);
  const thumbnailSource = useMemo(() => (thumbnailUri ? { uri: thumbnailUri } : undefined), [thumbnailUri]);

  const animateIn = () => {
    Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.container, style]}>
      {!loaded ? (
        <View style={[StyleSheet.absoluteFillObject, placeholderStyle]}>
          {thumbnailSource ? (
            <Image
              source={thumbnailSource}
              placeholder={{ blurhash }}
              contentFit={contentFit}
              cachePolicy={cachePolicy}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <Skeleton style={styles.skeleton} />
          )}
          <View style={styles.loadingScrim} />
        </View>
      ) : null}

      {source ? (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]}>
          <Image
            source={source}
            placeholder={{ blurhash }}
            contentFit={contentFit}
            cachePolicy={cachePolicy}
            transition={220}
            recyclingKey={`${recyclingKey ?? uri}-${attempt}`}
            accessibilityLabel={accessibilityLabel}
            style={[StyleSheet.absoluteFillObject as StyleProp<ImageStyle>, imageStyle]}
            onLoad={() => {
              imageMemoryCache.markLoaded(uri);
              setLoaded(true);
              setFailed(false);
              animateIn();
            }}
            onError={() => {
              imageMemoryCache.markFailed(uri);
              if (attempt < retryCount) {
                setTimeout(() => setAttempt((value) => value + 1), retryDelayMs * (attempt + 1));
              } else {
                setFailed(true);
              }
            }}
          />
        </Animated.View>
      ) : null}

      {failed ? <View style={styles.failedPlaceholder} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: colors.surfaceSoft },
  skeleton: { ...StyleSheet.absoluteFillObject, borderRadius: 0 },
  loadingScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,9,0.18)' },
  failedPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surface, borderRadius: radius.md },
});
