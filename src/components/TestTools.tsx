// Test-only tools (SPEC-00): Next day, Reset, and temporary Ring/Dots and Theme switches.
// Clearly labeled, and removed after Stage 3. T14 finishes this area.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GoalStyle } from '@/components/HabitCard';
import { THEME_LABELS, THEME_PREFERENCES } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { font, MIN_TAP_SIZE, radius, space } from '@/theme';

export function TestTools({
  goalStyle,
  onGoalStyle,
  onNextDay,
  onReset,
}: {
  goalStyle: GoalStyle;
  onGoalStyle: (style: GoalStyle) => void;
  onNextDay: () => void;
  onReset: () => void;
}) {
  const styles = useStyles();
  const { preference, setPreference } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <View style={styles.testTools} testID="test-tools">
      <Text style={styles.testTitle}>Test tools (prototype only)</Text>
      <View style={styles.testRow}>
        <Pressable
          onPress={onNextDay}
          style={styles.testButton}
          testID="next-day-button"
          accessibilityRole="button"
        >
          <Text style={styles.testButtonText}>Next day ›</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (confirmReset) {
              setConfirmReset(false);
              onReset();
            } else {
              setConfirmReset(true);
            }
          }}
          style={[styles.testButton, confirmReset && styles.testButtonDanger]}
          testID="reset-button"
          accessibilityRole="button"
          accessibilityLabel={confirmReset ? 'Tap again to erase everything' : 'Reset'}
        >
          <Text style={[styles.testButtonText, confirmReset && styles.testButtonDangerText]}>
            {confirmReset ? 'Tap again to erase all' : 'Reset'}
          </Text>
        </Pressable>
      </View>
      {/* Temporary until the Weekly goal style row in Profile (T11). */}
      <View
        style={styles.testRow}
        accessibilityRole="radiogroup"
        accessibilityLabel="Weekly goal style"
      >
        {(['ring', 'dots'] as const).map((option) => {
          const selected = goalStyle === option;
          return (
            <Pressable
              key={option}
              onPress={() => onGoalStyle(option)}
              style={[styles.testButton, selected && styles.chipSelected]}
              testID={`goal-style-${option}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.testButtonText, selected && styles.chipSelectedText]}>
                {option === 'ring' ? 'Ring' : 'Dots'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* Temporary until the Theme row in Profile (T11). */}
      <View style={styles.testRow} accessibilityRole="radiogroup" accessibilityLabel="Theme">
        {THEME_PREFERENCES.map((option) => {
          const selected = preference === option;
          return (
            <Pressable
              key={option}
              onPress={() => setPreference(option)}
              style={[styles.testButton, selected && styles.chipSelected]}
              testID={`theme-option-${option}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.testButtonText, selected && styles.chipSelectedText]}>
                {THEME_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
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
    testTools: {
      marginTop: space.xl,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
      gap: space.sm,
    },
    testTitle: { fontSize: font.small, color: c.onSurfaceMuted, fontWeight: '700' },
    testRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
    testButton: {
      minHeight: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    testButtonText: { color: c.onSurface, fontWeight: '700' },
    chipSelected: { backgroundColor: c.inverse, borderColor: c.inverse },
    chipSelectedText: { color: c.onInverse },
    testButtonDanger: { borderColor: c.onSurface },
    testButtonDangerText: { color: c.onSurface },
  });
