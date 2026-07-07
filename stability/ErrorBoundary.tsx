import { colors, radius, typography } from '@/design/tokens';
import { AppLogger } from '@/stability/AppLogger';
import { PropsWithChildren, Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    AppLogger.error('react_error_boundary', { message: error.message, stack: error.stack, componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>The app recovered safely. Please go back and try again.</Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  card: { padding: 22, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: typography.h2, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, textAlign: 'center', marginTop: 8 },
});
