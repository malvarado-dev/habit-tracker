// Test tools screen (SPEC-00, T17; canvas "History options · Stage 3", board 4). Prototype only,
// reached from the menu and hidden with SHOW_TEST_TOOLS. See TestTools.tsx for how to remove.

import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TestTools } from '@/components/TestTools';
import { SHOW_TEST_TOOLS } from '@/config/prototype';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, type ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, space } from '@/theme';
import type { Metadata } from 'expo-router/server';

import { pageTitle } from '@/components/pageTitle';

/** The page title on the web build (#113). */
export function generateMetadata(): Metadata {
  return { title: pageTitle('test-tools') };
}

export default function TestToolsScreen() {
  const styles = useStyles();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.screen} testID="test-tools-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={goBack}
          style={styles.back}
          testID="test-tools-back"
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
        >
          <Text style={styles.backText}>‹ Today</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Test tools
        </Text>
        <Text style={styles.label}>Prototype only · removed after Stage 3</Text>
        {SHOW_TEST_TOOLS ? <TestTools /> : <Text style={styles.label}>Test tools are off.</Text>}
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
    label: { ...textStyle('label'), color: c.onSurfaceMuted },
  });
