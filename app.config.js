const appEnv = process.env.APP_ENV || process.env.EXPO_PUBLIC_APP_ENV || 'development';
const isProduction = appEnv === 'production';
const isStaging = appEnv === 'staging';

const identifiers = {
  development: {
    name: 'Premium IPTV Dev',
    slug: 'premium-iptv-ui-dev',
    scheme: 'premiumiptvdev',
    iosBundleIdentifier: 'com.premiumiptv.dev',
    androidPackage: 'com.premiumiptv.dev',
  },
  staging: {
    name: 'Premium IPTV Staging',
    slug: 'premium-iptv-ui-staging',
    scheme: 'premiumiptvstaging',
    iosBundleIdentifier: 'com.premiumiptv.staging',
    androidPackage: 'com.premiumiptv.staging',
  },
  production: {
    name: 'Premium IPTV',
    slug: 'premium-iptv-ui',
    scheme: 'premiumiptv',
    iosBundleIdentifier: 'com.premiumiptv.app',
    androidPackage: 'com.premiumiptv.app',
  },
};

const selected = identifiers[appEnv] || identifiers.development;
const version = process.env.APP_VERSION || '1.0.0';
const buildNumber = process.env.IOS_BUILD_NUMBER || process.env.BUILD_NUMBER || '1';
const versionCode = Number(process.env.ANDROID_VERSION_CODE || process.env.VERSION_CODE || '1');

module.exports = {
  expo: {
    name: selected.name,
    slug: selected.slug,
    version,
    orientation: 'portrait',
    scheme: selected.scheme,
    userInterfaceStyle: 'dark',
    icon: './assets/icon.png',
    assetBundlePatterns: ['assets/*'],
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#050509',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: selected.iosBundleIdentifier,
      buildNumber,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIRequiresFullScreen: true,
      },
    },
    android: {
      package: selected.androidPackage,
      versionCode,
      resizeableActivity: false,
      permissions: [],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#050509',
      },
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: ['expo-router', 'expo-asset'],
    experiments: {
      typedRoutes: true,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      appEnv,
      isProduction,
      isStaging,
      buildProfile: process.env.EAS_BUILD_PROFILE || 'local',
    },
  },
};
