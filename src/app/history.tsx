// History (SPEC-00, T16; canvas "History options · Stage 3", board 1). Opened from the menu.
// Back returns to the screen the user came from, and its label names it.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HistoryView } from '@/components/history/HistoryView';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, type ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, space } from '@/theme';

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
        <Pressable
          onPress={goBack}
          style={styles.back}
          testID="history-back"
          accessibilityRole="button"
          accessibilityLabel={`Back to ${back.label}`}
        >
          <Text style={styles.backText}>‹ {back.label}</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          History
        </Text>
        <HistoryView
          onOpenDay={(date) =>
            router.push({ pathname: '/day/[date]', params: { date, from: 'history' } })
          }
        />
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
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    title: { ...textStyle('display'), color: c.onSurface },
  });
