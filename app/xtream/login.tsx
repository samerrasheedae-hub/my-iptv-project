import { Screen } from '@/components/Screen';
import { XtreamLoginForm, XtreamLoginFormValues } from '@/components/xtream/XtreamLoginForm';
import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { router } from 'expo-router';

export default function XtreamLoginScreen() {
  const { authenticate } = useXtreamRuntime();

  const handleAuthenticate = async (values: XtreamLoginFormValues) => {
    await authenticate(values);
    // بعد نجاح الاتصال، انتقل إلى شاشة الفئات
    router.replace('/xtream/categories');
  };

  return (
    <Screen padded={false}>
      <XtreamLoginForm onAuthenticate={handleAuthenticate} onCancel={() => router.back()} />
    </Screen>
  );
}
