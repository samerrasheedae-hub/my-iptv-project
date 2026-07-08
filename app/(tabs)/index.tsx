import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { colors } from '@/design/tokens';
import CategoryDropdown, { Category } from '@/components/CategoryDropdown';
import HeroSection from '@/components/HeroSection';
import { useNetflixHome } from '@/hooks/useNetflixHome';
import { useStreamingActions } from '@/hooks/useCatalog';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Movies');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [showSurprise, setShowSurprise] = useState(false);
  const [surprisePool, setSurprisePool] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedItem, setPickedItem] = useState<any>(null);

  const { data, isLoading } = useNetflixHome();
  const { toggleMyList } = useStreamingActions();

  const stripRef = useRef<ScrollView>(null);
  const startSpinRef = useRef<(() => void) | null>(null);

  // Must be before any early return
  useEffect(() => {
    if (showSurprise && surprisePool.length > 0) {
      const timer = setTimeout(() => startSpinRef.current?.(), 300);
      return () => clearTimeout(timer);
    }
  }, [showSurprise, surprisePool]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyIcon}>📡</Text>
        <Text style={styles.emptyTitle}>No source connected</Text>
        <Text style={styles.emptySubtitle}>Go to Settings → Add Playlist to connect your IPTV account</Text>
      </View>
    );
  }

  const heroItem = data.hero || {
    id: 'hero1',
    title: 'The Odyssey',
    genre: 'Adventure',
    year: '2026',
    description: 'Odysseus, the legendary King of Ithaca, embarks on a long and perilous journey home following the Trojan War.',
    image: 'https://picsum.photos/id/1015/720/400',
  };

  const continueItems = data.rows?.[0]?.items || [];
  const forYouItems = data.rows?.[1]?.items || data.rows?.[0]?.items || [];
  const allItems = [...continueItems, ...forYouItems];

  const handleWatchNow = (item: any) => {
    Alert.alert('Watch Now', `Starting: ${item.title}`);
  };

  const handleDetails = (item: any) => {
    Alert.alert('Details', item.description || item.title);
  };

  const handleMyList = (item: any) => {
    toggleMyList(item.id);
    Alert.alert('My List', `${item.title} added/removed from My List`);
  };

  const handleDownload = (item: any) => {
    Alert.alert('Download', `Download started for "${item.title}"`);
  };

  const handleShare = (item: any) => {
    Alert.alert('Share', `Sharing "${item.title}"`);
  };

  const openSurpriseMe = () => {
    if (selectedCategory === 'Live TV') {
      Alert.alert('Surprise Me', 'Surprise Me is available only for Movies and TV Series.');
      return;
    }
    if (allItems.length === 0) return;

    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const pool = shuffled.slice(0, Math.min(14, shuffled.length));

    setSurprisePool(pool);
    setPickedItem(null);
    setIsSpinning(false);
    setShowSurprise(true);
  };

  const closeSurprise = () => {
    setShowSurprise(false);
    setIsSpinning(false);
    setPickedItem(null);
  };

  const startSpin = () => {
    if (!stripRef.current || surprisePool.length === 0) return;

    setIsSpinning(true);
    setPickedItem(null);

    let xPos = 0;
    const totalDuration = 2800;
    const startTime = Date.now();

    const spinInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;
      const easedSpeed = 18 + (1 - progress) * 14;

      xPos += easedSpeed;

      if (stripRef.current) {
        stripRef.current.scrollTo({ x: xPos, animated: false });
      }

      if (elapsed >= totalDuration) {
        clearInterval(spinInterval);

        const randomIndex = Math.floor(Math.random() * surprisePool.length);
        const final = surprisePool[randomIndex];

        setPickedItem(final);
        setIsSpinning(false);

        const cardWidth = 84;
        const targetX = Math.max(8, (randomIndex * cardWidth) - 22);

        setTimeout(() => {
          if (stripRef.current) {
            stripRef.current.scrollTo({ x: targetX, animated: true });
          }
        }, 100);
      }
    }, 16);
  };

  startSpinRef.current = startSpin;

  const handleSpinAgain = () => {
    if (surprisePool.length === 0) return;
    setPickedItem(null);
    setIsSpinning(true);
    setTimeout(() => {
      if (stripRef.current) stripRef.current.scrollTo({ x: 0, animated: false });
      startSpin();
    }, 50);
  };

  const handleWatchPicked = () => {
    if (pickedItem) {
      closeSurprise();
      handleWatchNow(pickedItem);
    }
  };

  const handleMood = (mood: string) => {
    setActiveMood(activeMood === mood ? null : mood);
  };

  const getMatchingItems = () => {
    if (!activeMood || allItems.length === 0) return [];

    let filtered = [...allItems];

    if (activeMood === 'Happy') {
      filtered = filtered.filter(i => i.title?.toLowerCase().includes('live') || i.title?.toLowerCase().includes('league') || i.title?.toLowerCase().includes('happy'));
    } else if (activeMood === 'Sad') {
      filtered = filtered.filter(i => i.title?.toLowerCase().includes('signal') || i.title?.toLowerCase().includes('sky') || i.title?.toLowerCase().includes('dark'));
    } else if (activeMood === 'Excited') {
      filtered = filtered.filter(i => i.title?.toLowerCase().includes('live') || i.title?.toLowerCase().includes('aurora') || i.title?.toLowerCase().includes('fire'));
    } else if (activeMood === 'Tired') {
      filtered = filtered.filter(i => i.title?.toLowerCase().includes('sky') || i.title?.toLowerCase().includes('signal') || i.title?.toLowerCase().includes('quiet'));
    }

    return filtered.length > 0 ? filtered.slice(0, 8) : allItems.slice(0, 8);
  };

  const matchingItems = activeMood ? getMatchingItems() : [];

  const ContentCard = ({ item, onPress }: { item: any; onPress: () => void }) => (
    <TouchableOpacity style={styles.contentCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardPoster} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        {item.year && <Text style={styles.cardMeta}>{item.year}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <CategoryDropdown selected={selectedCategory} onSelect={setSelectedCategory} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HeroSection
          item={heroItem}
          onWatchNow={() => handleWatchNow(heroItem)}
          onDetails={() => handleDetails(heroItem)}
          onMyList={() => handleMyList(heroItem)}
          onDownload={() => handleDownload(heroItem)}
          onShare={() => handleShare(heroItem)}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {continueItems.slice(0, 6).map((item: any, index: number) => (
              <ContentCard key={index} item={item} onPress={() => handleWatchNow(item)} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your mood?</Text>

          {selectedCategory === 'Live TV' ? (
            <Text style={styles.moodNote}>Mood recommendations are for Movies & TV Series.</Text>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
                {[
                  { emoji: '😊', label: 'Happy' },
                  { emoji: '😢', label: 'Sad' },
                  { emoji: '🔥', label: 'Excited' },
                  { emoji: '😴', label: 'Tired' },
                ].map((mood, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.moodChip, activeMood === mood.label && styles.moodChipActive]}
                    onPress={() => handleMood(mood.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moodText}>{mood.emoji} {mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {activeMood && (
                <TouchableOpacity onPress={() => setActiveMood(null)} style={styles.clearMood}>
                  <Text style={styles.clearMoodText}>Clear mood</Text>
                </TouchableOpacity>
              )}

              {activeMood && matchingItems.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Matching your mood <Text style={styles.moodCount}>{matchingItems.length}</Text>
                    </Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {matchingItems.map((item: any, index: number) => (
                      <ContentCard key={index} item={item} onPress={() => handleWatchNow(item)} />
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.surpriseBanner} activeOpacity={0.9} onPress={openSurpriseMe}>
          <View>
            <Text style={styles.surpriseTitle}>🎲 Surprise Me!</Text>
            <Text style={styles.surpriseSubtitle}>Let us pick for you</Text>
          </View>
          <Text style={styles.surpriseIcon}>🎞️</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forYouItems.slice(0, 6).map((item: any, index: number) => (
              <ContentCard key={index} item={item} onPress={() => handleWatchNow(item)} />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <Modal visible={showSurprise} transparent animationType="fade" onRequestClose={closeSurprise}>
        <View style={styles.modalOverlay}>
          <View style={styles.surpriseModal}>
            <TouchableOpacity style={styles.modalClose} onPress={closeSurprise}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>🎲 Surprise Me</Text>
            <Text style={styles.modalSubtitle}>A cinematic pick just for you</Text>

            <View style={styles.stripWrapper}>
              <Text style={styles.stripLabel}>
                {isSpinning ? '🎞️ Spinning the reel...' : pickedItem ? 'Your surprise is ready' : 'Preparing...'}
              </Text>

              <View style={styles.filmStrip}>
                <View style={styles.filmHoles}>
                  {Array.from({ length: 11 }).map((_, i) => <View key={i} style={styles.hole} />)}
                </View>

                <ScrollView
                  ref={stripRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.stripScroll}
                  contentContainerStyle={styles.stripContent}
                  scrollEnabled={false}
                >
                  {[...surprisePool, ...surprisePool, ...surprisePool].map((item, index) => (
                    <View key={index} style={styles.stripCard}>
                      <View style={styles.posterPlaceholder} />
                      <Text style={styles.stripCardTitle} numberOfLines={1}>{item.title}</Text>
                      {item.year && <Text style={styles.stripCardMeta}>{item.year}</Text>}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.filmHoles}>
                  {Array.from({ length: 11 }).map((_, i) => <View key={i} style={styles.hole} />)}
                </View>
              </View>
            </View>

            {!isSpinning && pickedItem && (
              <View style={styles.finalSection}>
                <Text style={styles.finalLabel}>✨ YOUR SURPRISE PICK</Text>
                <TouchableOpacity style={styles.finalCard} onPress={handleWatchPicked} activeOpacity={0.9}>
                  <View style={styles.finalPoster} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.finalTitle} numberOfLines={2}>{pickedItem.title}</Text>
                    <Text style={styles.finalMeta}>
                      {pickedItem.genre || 'Movie / Series'} • {pickedItem.year || '2026'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {!isSpinning && pickedItem && (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.spinAgainBtn} onPress={handleSpinAgain}>
                  <Text style={styles.spinAgainText}>Spin Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.watchBtn} onPress={handleWatchPicked}>
                  <Text style={styles.watchBtnText}>Watch Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {isSpinning && (
              <Text style={styles.spinningText}>Spinning the reel...</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 32 },
  loadingText: { color: colors.text, fontSize: 16 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { color: colors.textSubtle, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  seeAll: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  contentCard: {
    width: 118, height: 158, backgroundColor: colors.surface,
    borderRadius: 10, marginRight: 10, overflow: 'hidden',
  },
  cardPoster: { flex: 1, backgroundColor: '#222' },
  cardInfo: { paddingHorizontal: 8, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.65)' },
  cardTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  cardMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 1 },
  moodScroll: { marginTop: 8 },
  moodChip: {
    backgroundColor: colors.moodBg, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 24, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  moodChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  moodText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  moodCount: { color: colors.accent, fontWeight: '700' },
  clearMood: { alignSelf: 'flex-end', marginTop: 2, marginBottom: 6 },
  clearMoodText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  moodNote: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  surpriseBanner: {
    marginHorizontal: 20, backgroundColor: colors.accent, borderRadius: 16,
    padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
  surpriseTitle: { color: '#000000', fontSize: 18, fontWeight: '700' },
  surpriseSubtitle: { color: 'rgba(0,0,0,0.75)', fontSize: 13, marginTop: 2 },
  surpriseIcon: { fontSize: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  surpriseModal: { backgroundColor: '#1C1C1C', borderRadius: 18, padding: 20, width: '94%', maxWidth: 380, maxHeight: '88%' },
  modalClose: { position: 'absolute', top: 14, right: 16, zIndex: 10 },
  modalCloseText: { color: colors.textSecondary, fontSize: 22 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  stripWrapper: { marginVertical: 8 },
  stripLabel: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  filmStrip: { backgroundColor: '#0D0D0D', borderRadius: 12, paddingVertical: 6, borderWidth: 7, borderColor: '#222', overflow: 'hidden' },
  filmHoles: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginVertical: 1 },
  hole: { width: 7, height: 7, backgroundColor: '#333', borderRadius: 1 },
  stripScroll: { height: 88 },
  stripContent: { paddingHorizontal: 6, alignItems: 'center' },
  stripCard: { width: 78, marginRight: 6, backgroundColor: '#0F0F0F', borderRadius: 7, padding: 5, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  posterPlaceholder: { width: '100%', height: 48, backgroundColor: '#1A1A1A', borderRadius: 5, marginBottom: 4 },
  stripCardTitle: { color: colors.text, fontSize: 9.5, fontWeight: '700', textAlign: 'center' },
  stripCardMeta: { color: colors.textSecondary, fontSize: 8, marginTop: 1 },
  finalSection: { marginTop: 12, marginBottom: 4 },
  finalLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  finalCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: colors.accent },
  finalPoster: { width: 54, height: 68, backgroundColor: '#222', borderRadius: 6, marginRight: 12 },
  finalTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  finalMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  spinAgainBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  spinAgainText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  watchBtn: { flex: 1, backgroundColor: colors.buttonPrimary, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  watchBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  spinningText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 12 },
});
