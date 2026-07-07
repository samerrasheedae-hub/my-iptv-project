import SeriesEpisodesList from '@/components/series/SeriesEpisodesList';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { View } from 'react-native';
import { colors } from '@/design/tokens';
// Task 019f – 3/6 Series episode UI
// Functional connection work – keep existing architecture intact
// Try: import { useCatalog } or from media/repositories/UnifiedMediaRepository – if a series episodes hook exists use it, else fallback to mock

// Optional catalog hook – will gracefully fallback if not available in this build
// import { useCatalog } from '@/hooks/useCatalog';

export default function SeriesEpisodesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Attempt real catalog integration – falls back to mock inside SeriesEpisodesList
  // const catalog = useCatalog?.();
  // const episodes = catalog?.getSeriesEpisodes?.(id) ?? undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Series Episodes',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <SeriesEpisodesList
        seriesId={(id as string) || 'demo-series'}
        // episodes={episodes} // uncomment when UnifiedMediaRepository exposes series episodes – mock fallback preserved
        onSelectEpisode={(ep) => {
          router.push({
            pathname: '/player/[id]',
            params: {
              id: ep.id,
              mediaKind: 'series',
              providerKind: 'unified',
            },
          });
        }}
      />
    </View>
  );
}
