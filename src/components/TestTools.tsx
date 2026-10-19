// Test tools (SPEC-00, T14, moved to its own screen in T17): prototype only. A Real / Test switch,
// the date, and in Test only, Next day, Back to today, and Reset (tap twice). Real is your real
// data on the real date; Test is a separate save, so History can be tried in full without
// touching real tracking. Ring/Dots and Theme live in Profile, where the playtest records them.
//
// To remove after Stage 3:
// 1. Delete this file, testToolsText.ts, testTools.test.ts, TestModeBanner.tsx,
//    src/app/test-tools.tsx, features/tracker/modes.ts (and its test), and src/config/prototype.ts.
// 2. In SideMenu.tsx, delete the Test tools item and its divider.
// 3. In app/_layout.tsx, delete <TestModeBanner />.
// 4. In TrackerProvider.tsx, keep one tracker: load and save REAL_KEY directly, drop mode and
//    testTools. The real save shape (state.ts) has no test fields, so it doesn't change.
// To only hide it, set SHOW_TEST_TOOLS to false in src/config/prototype.ts.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { Mode } from '@/features/tracker/modes';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { modeHelpText, pretendDateText, realDateText } from './testToolsText';

const MODES: { key: Mode; label: string }[] = [
  { key: 'real', label: 'Real' },
  { key: 'test', label: 'Test' },
];

export function TestTools() {
  const styles = useStyles();
  const { mode, setMode, today, testTools } = useTracker();
  const [confirmReset, setConfirmReset] = useState(false);
  const ahead = testTools.dayOffset > 0;

  return (
    <View style={styles.box} testID="test-tools">
      <View style={styles.section}>
        <Text style={styles.heading} accessibilityRole="header">
          Data
        </Text>
        <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="Data">
          {MODES.map((m) => {
            const on = m.key === mode;
            return (
              <Pressable
                key={m.key}
                onPress={() => {
                  setConfirmReset(false);
                  setMode(m.key);
                }}
                style={[styles.chip, on && styles.chipOn]}
                testID={`mode-${m.key}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.help}>{modeHelpText(mode)}</Text>
      </View>

      <Text style={styles.date} testID="test-tools-date" accessibilityLiveRegion="polite">
        {mode === 'test' ? pretendDateText(today, testTools.dayOffset) : realDateText(today)}
      </Text>

      {mode === 'test' ? (
        <View style={styles.row}>
          <Pressable
            onPress={testTools.nextDay}
            style={styles.button}
            testID="next-day-button"
            accessibilityRole="button"
            accessibilityLabel="Next day"
          >
            <Text style={styles.buttonText}>Next day ›</Text>
          </Pressable>
          <Pressable
            onPress={testTools.backToToday}
            disabled={!ahead}
            style={[styles.button, !ahead && styles.off]}
            testID="back-to-today-button"
            accessibilityRole="button"
            accessibilityLabel="Back to today, keeps your test check-ins"
            accessibilityState={{ disabled: !ahead }}
          >
            <Text style={styles.buttonText}>Back to today</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!confirmReset) return setConfirmReset(true);
              setConfirmReset(false);
              testTools.reset();
            }}
            style={[styles.button, confirmReset && styles.confirm]}
            testID="reset-button"
            accessibilityRole="button"
            accessibilityLabel={
              confirmReset ? 'Tap again to erase the test data' : 'Reset test data'
            }
          >
            <Text style={[styles.buttonText, confirmReset && styles.confirmText]}>
              {confirmReset ? 'Tap again to erase test data' : 'Reset test data'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: {
      padding: space.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.onSurfaceMuted,
      gap: space.lg,
    },
    section: { gap: space.sm },
    heading: { ...textStyle('label'), color: c.onSurfaceMuted },
    choices: { flexDirection: 'row', gap: space.sm },
    chip: {
      minHeight: MIN_TAP_SIZE,
      minWidth: MIN_TAP_SIZE * 2,
      paddingHorizontal: space.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { backgroundColor: c.onSurface, borderColor: c.onSurface },
    chipText: { ...textStyle('label'), color: c.onSurfaceMuted },
    chipTextOn: { color: c.surfaceSheet },
    help: { ...textStyle('body'), color: c.onSurfaceMuted },
    date: { ...textStyle('body', '600'), color: c.onSurface },
    row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
    button: {
      minHeight: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    buttonText: { ...textStyle('label'), color: c.onSurface },
    off: { opacity: 0.4 },
    confirm: { borderColor: c.danger },
    confirmText: { color: c.danger },
  });
