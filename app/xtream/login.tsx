import { Screen } from '@/components/Screen';
import { XtreamLoginForm } from '@/components/xtream/XtreamLoginForm';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { router } from 'expo-router';

export default function XtreamLoginScreen() {
  const { authenticate } = useXtreamRuntime();

  return (
    <Screen padded={false}>
      <XtreamLoginForm onAuthenticate={authenticate} onCancel={() => router.back()} />
    </Screen>
  );
}
