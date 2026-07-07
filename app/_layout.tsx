import { colors } from '@/design/tokens';
import { RepositoryProvider } from '@/providers/RepositoryProvider';
import { XtreamRuntimeProvider } from '@/providers/XtreamRuntimeProvider';
import { UnifiedMediaRuntimeProvider } from '@/providers/UnifiedMediaRuntimeProvider';
import { M3URuntimeProvider } from '@/providers/M3URuntimeProvider';
import { ErrorBoundary } from '@/stability/ErrorBoundary';
import { installGlobalErrorHandler } from '@/stability/globalErrorHandler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

installGlobalErrorHandler();

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RepositoryProvider>
        <XtreamRuntimeProvider>
          <M3URuntimeProvider>
          <UnifiedMediaRuntimeProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="player/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack>
          </UnifiedMediaRuntimeProvider>
          </M3URuntimeProvider>
        </XtreamRuntimeProvider>
      </RepositoryProvider>
    </ErrorBoundary>
  );
}
