import { colors, radius } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  search: 'search',
  'my-list': 'bookmark',
  downloads: 'download',
  settings: 'settings',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.item,
        tabBarBackground: () => <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? icons[route.name] : (`${icons[route.name]}-outline` as keyof typeof Ionicons.glyphMap)} size={24} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="my-list" options={{ title: 'My List' }} />
      <Tabs.Screen name="downloads" options={{ title: 'Downloads' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    height: 70,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    overflow: 'hidden',
  },
  item: { borderRadius: radius.full, marginVertical: 10 },
});
