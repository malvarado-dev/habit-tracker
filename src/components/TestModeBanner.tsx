// "Test mode: not your real data" (SPEC-00, T17). A thin, quiet strip at the very bottom of every
// screen while Test is on. It sits below the screens rather than over them, so it can never hide
// the last card or row. It covers the home indicator area itself. Prototype only.

import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { testBanner, type ThemeColors } from '@/design/tokens';
import { useTracker } from '@/features/tracker/TrackerProvider';

export function TestModeBanner() {
  const styles = useStyles();
  const { mode } = useTracker();
  const insets = useSafeAreaInsets();
  if (mode !== 'test') return null;
  return (
    <View
      style={[styles.strip, { paddingBottom: insets.bottom + testBanner.paddingVertical }]}
      testID="test-mode-banner"
      accessible
      accessibilityLabel="Test mode: not your real data"
    >
      <Text style={styles.text}>Test mode: not your real data</Text>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    strip: {
      paddingTop: testBanner.paddingVertical,
      alignItems: 'center',
      backgroundColor: c.surfaceDim,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    text: { ...textStyle('caption'), color: c.onSurfaceMuted },
  });
