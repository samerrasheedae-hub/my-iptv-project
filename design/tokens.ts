import { Platform } from 'react-native';

export const colors = {
  // === Core Dark Theme ===
  background: '#0A0A0A',
  backgroundElevated: '#121212',
  surface: '#141414',
  surfaceSoft: '#1F1F1F',
  surfaceGlass: 'rgba(20, 20, 20, 0.85)',
  surfaceLight: '#1F1F1F',

  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  textSecondary: '#A0A0A0',
  textSubtle: '#666666',

  // Buttons (مطابق للصور المرجعية)
  primary: '#FFFFFF',
  primaryDark: '#000000',
  buttonPrimary: '#FFFFFF',
  buttonPrimaryText: '#000000',
  buttonSecondary: 'rgba(255,255,255,0.12)',
  buttonSecondaryText: '#FFFFFF',

  // Accent
  accent: '#FF4D00',
  accentLight: '#FF6B35',

  border: '#333333',
  borderLight: '#222222',

  success: '#34C759',
  warning: '#FFB547',
  error: '#FF3B30',

  // Tab Bar
  tabBarBackground: '#0F0F0F',
  tabActive: '#FFFFFF',
  tabInactive: '#888888',

  // Special
  heroOverlay: 'rgba(0,0,0,0.65)',
  cardOverlay: 'rgba(0,0,0,0.55)',

  // Mood
  moodBg: '#1F1F1F',
  moodActiveBg: '#FF4D00',

  // Dropdown
  dropdownBg: '#1F1F1F',
  dropdownBorder: '#333333',
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 44,
};

export const typography = {
  family: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  title: 34,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  caption: 12,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
};
