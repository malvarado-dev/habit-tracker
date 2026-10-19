// "Weekly goal met · Habit" under the Energy bar (SPEC-00, T18). Plain text, no box: the words in
// the text color, the habit name in its habit color, at large-text size so every habit color
// passes 3:1 on both sheets. It fades in, holds, and fades out; it never scales, since scaling
// blurs text. Reduced motion: it appears and disappears with no fade. Screen readers hear it once.

import { useEffect, useMemo } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { weeklyGoalMet as size, type ThemeColors } from '@/design/tokens';
import type { Habit } from '@/rules/scoring';

/** `id` changes each time it should play; null shows nothing. */
export type GoalMetMoment = { habit: Habit; id: number } | null;

export function WeeklyGoalMet({ moment }: { moment: GoalMetMoment }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);
  const gm = tuning.energy.goalMet;

  useEffect(() => {
    if (!moment) return;
    const name = moment.habit.name || 'Habit';
    AccessibilityInfo.announceForAccessibility(`Weekly goal met, ${name}`);
    const hold = gm.showMs - gm.fadeMs * 2;
    if (reduceMotion) {
      // No fade: show, hold, hide.
      shown.value = 1;
      const timer = setTimeout(() => {
        shown.value = 0;
      }, gm.showMs);
      return () => clearTimeout(timer);
    }
    shown.value = withSequence(
      withTiming(1, { duration: gm.fadeMs }),
      withDelay(hold, withTiming(0, { duration: gm.fadeMs })),
    );
  }, [moment, reduceMotion, shown, gm]);

  const style = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    // The slot always keeps its height, so the cards below never jump when it appears.
    <Animated.View
      style={[styles.slot, style]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      testID="weekly-goal-met"
    >
      {moment ? (
        <Text style={styles.text} numberOfLines={1}>
          Weekly goal met ·{' '}
          <Text style={{ color: colors[moment.habit.color] }} testID="weekly-goal-met-habit">
            {moment.habit.name}
          </Text>
        </Text>
      ) : null}
    </Animated.View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    slot: { minHeight: size.slotHeight, alignItems: 'center', justifyContent: 'center' },
    text: {
      ...textStyle('title', '700'),
      fontSize: size.fontSize,
      lineHeight: size.lineHeight,
      color: c.onSurface,
    },
  });
