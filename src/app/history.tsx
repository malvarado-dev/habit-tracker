// History (P2-18a, #89). Opened from the History link on Today and from the menu.
// Back returns to the screen the user came from, and its label names it.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HistoryView } from '@/components/history/HistoryView';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, type ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const BACK = {
  today: { label: 'Today', path: '/' },
  profile: { label: 'Profile', path: '/profile' },
} as const;

export default function HistoryScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ from?: string }>();
  const back = BACK[params.from === 'profile' ? 'profile' : 'today'];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(back.path);
  };

  return (
    <SafeAreaView style={styles.screen} testID="history-screen">
      <ScrollView contentContainerStyle={styles.content}>
        {/* Round back button with the title centered, like the P2-18a boards. */}
        <View style={styles.bar}>
          <Pressable
            onPress={goBack}
            style={styles.back}
            testID="history-back"
            accessibilityRole="button"
            accessibilityLabel={`Back to ${back.label}`}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            History
          </Text>
          {/* Keeps the title centered. */}
          <View style={styles.spacer} />
        </View>
        <HistoryView />
      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surfaceSheet },
    content: {
      width: '100%',
      maxWidth: todayLayout.sheetMaxWidth,
      alignSelf: 'center',
      padding: space.lg,
      gap: space.md,
    },
    bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: {
      width: MIN_TAP_SIZE,
      height: MIN_TAP_SIZE,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    spacer: { width: MIN_TAP_SIZE, height: MIN_TAP_SIZE },
    backText: { ...textStyle('title'), color: c.onSurface },
    title: { ...textStyle('habitName', '700'), color: c.onSurface },
  });
