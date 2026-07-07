import { ProgressiveImage } from '@/components/images/ProgressiveImage';
import { colors, radius, shadows, spacing, typography } from '@/design/tokens';
import { ContentItem } from '@/types/content';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function HeroBanner({ item, onToggleMyList }: { item: ContentItem; onToggleMyList?: (id: string) => void }) {
  const router = useRouter();
  const facts = [item.year, item.maturityRating, item.durationLabel].filter(Boolean);

  const handlePlay = () => {
    router.push({ pathname: '/player/[id]', params: { id: item.id } });
  };

  return (
    <View style={styles.container}>
      <ProgressiveImage
        uri={item.backdropUrl}
        thumbnailUri={item.posterUrl}
        style={StyleSheet.absoluteFillObject}
        recyclingKey={`hero-${item.id}`}
        accessibilityLabel={item.title}
      />
      <LinearGradient
        colors={['transparent', 'rgba(5,5,9,0.65)', '#050509']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.brandText}>Premium IPTV</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Featured Experience</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.facts}>
          {facts.map((fact, index) => (
            <Text key={`fact-${index}`} style={styles.fact}>{String(fact)}</Text>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handlePlay} style={[styles.button, styles.primary]}>
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.buttonText}>Play</Text>
          </Pressable>

          {onToggleMyList ? (
            <Pressable onPress={() => onToggleMyList(item.id)} style={[styles.button, styles.secondary]}>
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.buttonText}>My List</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 300,
    width: '100%',
    overflow: 'hidden',
  },
  brandRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  logoMark: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  facts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  fact: {
    color: colors.textMuted,
    fontSize: 14,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
