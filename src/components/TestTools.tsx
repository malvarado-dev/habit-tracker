// Test tools (SPEC-00, T14): prototype only, so a week can be played in minutes.
// Shows the pretend date, Next day, Back to today, and Reset (tap twice to confirm).
// Ring/Dots and Theme live in Profile, where the playtest records each tester's pick.
//
// To remove after Stage 3:
// 1. Delete this file, testToolsText.ts, testTools.test.ts, and src/config/prototype.ts.
// 2. In HabitSheet.tsx, delete the SHOW_TEST_TOOLS block and its two imports.
// 3. In features/tracker/state.ts, delete the nextDay and backToToday actions and dayOffset.
// To only hide it, set SHOW_TEST_TOOLS to false in src/config/prototype.ts.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import type { DateKey } from '@/rules/dates';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { pretendDateText } from './testToolsText';

export function TestTools(props: {
  today: DateKey;
  dayOffset: number;
  onNextDay: () => void;
  onBackToToday: () => void;
  onReset: () => void;
}) {
  const styles = useStyles();
  const [confirmReset, setConfirmReset] = useState(false);
  const ahead = props.dayOffset > 0;

  return (
    <View style={styles.box} testID="test-tools">
      <Text style={styles.title}>Test tools · prototype only</Text>
      <Text style={styles.date} testID="test-tools-date" accessibilityLiveRegion="polite">
        {pretendDateText(props.today, props.dayOffset)}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={props.onNextDay}
          style={styles.button}
          testID="next-day-button"
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <Text style={styles.buttonText}>Next day ›</Text>
        </Pressable>
        <Pressable
          onPress={props.onBackToToday}
          disabled={!ahead}
          style={[styles.button, !ahead && styles.off]}
          testID="back-to-today-button"
          accessibilityRole="button"
          accessibilityLabel="Back to today, keeps your check-ins"
          accessibilityState={{ disabled: !ahead }}
        >
          <Text style={styles.buttonText}>Back to today</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!confirmReset) return setConfirmReset(true);
            setConfirmReset(false);
            props.onReset();
          }}
          style={[styles.button, confirmReset && styles.confirm]}
          testID="reset-button"
          accessibilityRole="button"
          accessibilityLabel={confirmReset ? 'Tap again to erase everything' : 'Reset'}
        >
          <Text style={[styles.buttonText, confirmReset && styles.confirmText]}>
            {confirmReset ? 'Tap again to erase all' : 'Reset'}
          </Text>
        </Pressable>
      </View>
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
      marginTop: space.xl,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.onSurfaceMuted,
      gap: space.sm,
    },
    title: { ...textStyle('caption'), color: c.onSurfaceMuted },
    date: { ...textStyle('body'), color: c.onSurface },
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
