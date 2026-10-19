// Habits (SPEC-00, T12; Figma "Habits · Phone"): every habit (1 to 15), tap one to edit it.
// Back returns to where the user came from (Today or Profile), and its label names that screen.
// After a remove, an inline Undo bar shows here for a few seconds. Add habit comes in T13.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { iconLetter } from '@/components/habitCardText';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { tints, type ThemeColors } from '@/design/tokens';
import { setRemoved, useRemovedHabit } from '@/features/habits/undoRemove';
import { listLine } from '@/features/habits/weeklyGoal';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const BACK = {
  today: { label: 'Today', path: '/' },
  profile: { label: 'Profile', path: '/profile' },
} as const;

export default function HabitsScreen() {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const { state, dispatch } = useTracker();
  const removed = useRemovedHabit();
  const params = useLocalSearchParams<{ from?: string }>();
  // Where Habits was opened from. Anything else falls back to Today.
  const back = BACK[params.from === 'profile' ? 'profile' : 'today'];

  // The Undo bar goes away on its own after a few seconds.
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), tuning.habits.undoMs);
    return () => clearTimeout(timer);
  }, [removed]);

  const goBack = () => {
    setRemoved(null);
    if (router.canGoBack()) router.back();
    else router.replace(back.path);
  };

  const undo = () => {
    if (!removed) return;
    dispatch({ type: 'restoreHabit', habit: removed.habit, index: removed.index });
    setRemoved(null);
  };

  return (
    <SafeAreaView style={styles.screen} testID="habits-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={goBack}
          style={styles.back}
          testID="habits-back"
          accessibilityRole="button"
          accessibilityLabel={`Back to ${back.label}`}
        >
          <Text style={styles.backText}>‹ {back.label}</Text>
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">
          Habits
        </Text>

        <View style={styles.list}>
          {state.habits.map((habit) => {
            const color = c[habit.color];
            const line = listLine(habit.goal);
            const name = habit.name || 'Unnamed habit';
            return (
              <Pressable
                key={habit.id}
                onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                testID={`habits-row-${habit.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${line}`}
                accessibilityHint="Edit this habit"
              >
                <View style={[styles.icon, { backgroundColor: withAlpha(color, tints.icon) }]}>
                  <Text style={[styles.iconLetter, { color }]}>{iconLetter(habit.name)}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.line}>{line}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.help}>1 to 15 habits. Tap a habit to edit it.</Text>
      </ScrollView>

      {removed ? (
        <View style={styles.undoWrap} pointerEvents="box-none">
          <View style={styles.undoBar} testID="habits-undo-bar" accessibilityLiveRegion="polite">
            <Text style={styles.undoText} numberOfLines={1}>
              {removed.habit.name || 'Habit'} removed
            </Text>
            <Pressable
              onPress={undo}
              style={styles.undoButton}
              testID="habits-undo"
              accessibilityRole="button"
              accessibilityLabel={`Undo, bring back ${removed.habit.name || 'the habit'}`}
            >
              <Text style={styles.undoAction}>Undo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const ICON = 36;

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surfaceSheet },
    content: {
      padding: space.lg,
      paddingBottom: space.xxl * 3,
      gap: space.md,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    title: { ...textStyle('display'), color: c.onSurface, marginBottom: space.sm },
    list: { gap: space.md },
    row: {
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.sm,
      paddingLeft: space.sm,
      paddingRight: space.lg,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.7 },
    icon: {
      width: ICON,
      height: ICON,
      borderRadius: ICON / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLetter: { ...textStyle('habitName', '700') },
    rowText: { flex: 1 },
    name: { ...textStyle('habitName'), color: c.onSurface },
    line: { ...textStyle('caption'), color: c.onSurfaceMuted },
    chevron: { ...textStyle('habitName'), color: c.onSurfaceMuted },
    help: { ...textStyle('caption'), color: c.onSurfaceMuted },
    undoWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: space.xl,
      alignItems: 'center',
      paddingHorizontal: space.lg,
    },
    undoBar: {
      width: '100%',
      maxWidth: 528,
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: space.xl,
      paddingRight: space.sm,
      borderRadius: radius.pill,
      backgroundColor: c.inverse,
      // undo-bar: a 1 pt border keeps the edge visible on the dark sheet.
      borderWidth: 1,
      borderColor: c.border,
    },
    undoText: { ...textStyle('body'), color: c.onInverse, flex: 1 },
    undoButton: {
      minHeight: MIN_TAP_SIZE,
      minWidth: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      justifyContent: 'center',
    },
    undoAction: { ...textStyle('label'), color: c.primary },
  });
