import { Screen } from '@/components/Screen';
import { M3USourceForm } from '@/components/m3u/M3USourceForm';
import { useM3URuntime } from '@/providers/M3URuntimeProvider';
import { router } from 'expo-router';

export default function M3USourceScreen() {
  const { registerSource } = useM3URuntime();

  return (
    <Screen padded={false}>
      <M3USourceForm onRegister={registerSource} onCancel={() => router.back()} />
    </Screen>
  );
}
