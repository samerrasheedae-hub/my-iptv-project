# Production Build and App Store Release Readiness

This pass prepares the Expo app for Android/iOS production builds without changing features, UI design, or core IPTV architecture.

## Build configuration

Added:

```text
app.config.js
eas.json
```

`app.config.js` provides environment-aware Expo configuration for:

- development
- staging
- production

Production identifiers:

```text
App name: Premium IPTV
iOS bundle ID: com.premiumiptv.app
Android package: com.premiumiptv.app
Version: 1.0.0
iOS buildNumber: 1
Android versionCode: 1
```

Build numbers can be overridden with:

```text
APP_VERSION
IOS_BUILD_NUMBER
ANDROID_VERSION_CODE
BUILD_NUMBER
VERSION_CODE
```

## EAS Build profiles

`eas.json` includes:

```text
development  -> internal dev client / Android APK / iOS simulator
staging      -> internal distribution / Android APK / iOS device
production   -> store distribution / Android AAB / iOS store build
```

Production Android build type:

```text
app-bundle
```

## Assets

Generated production-safe assets:

```text
assets/icon.png              1024x1024
assets/adaptive-icon.png     1024x1024
assets/splash.png            1242x2688
assets/favicon.png           256x256
```

Configured in Expo:

```text
icon
adaptiveIcon
splash
favicon
assetBundlePatterns
```

## Permissions and platform compliance

Android dangerous permissions are explicitly empty:

```json
"permissions": []
```

iOS includes:

```text
ITSAppUsesNonExemptEncryption: false
UIRequiresFullScreen: true
```

The app remains portrait-first and non-resizable on Android.

## Production logging

Updated:

```text
stability/AppLogger.ts
network/logger.ts
repositories/mock/createMockRepositoryContainer.ts
```

Console logging is disabled in production mode through environment-aware loggers.

## Scripts

Added production build helper scripts:

```bash
npm run start:dev
npm run start:staging
npm run start:prod
npm run expo:config:prod
npm run eas:build:android:preview
npm run eas:build:android:prod
npm run eas:build:ios:prod
npm run eas:build:all:prod
```

## Build commands

Android production AAB:

```bash
npm install
npx eas build --platform android --profile production
```

iOS production build:

```bash
npm install
npx eas build --platform ios --profile production
```

Both platforms:

```bash
npm install
npx eas build --platform all --profile production
```

## Validation performed

TypeScript validation was run successfully:

```bash
npm run typecheck -- --pretty false
```

Expo production config validation was run successfully:

```bash
APP_ENV=production EXPO_PUBLIC_APP_ENV=production npx expo config --type public
```

Static config validation confirmed:

```text
name: Premium IPTV
iOS bundle ID: com.premiumiptv.app
Android package: com.premiumiptv.app
version: 1.0.0
versionCode: 1
buildNumber: 1
permissions: []
```

## Dependency audit note

`npm install` completed successfully. npm reported transitive dependency audit warnings from the Expo/React Native dependency tree. Review with `npm audit` before final store submission, but avoid `npm audit fix --force` unless you are ready to validate breaking dependency upgrades.

## Notes before actual store submission

Before submitting to the stores, update these values if needed:

```text
com.premiumiptv.app
Premium IPTV
version/build numbers
store screenshots
privacy policy URL
support URL
app category/rating
EAS project ID after eas init
Apple/Google signing credentials
```

No features, business logic, Xtream/M3U/Unified Engine code, player architecture, or UI design were changed by this pass.
