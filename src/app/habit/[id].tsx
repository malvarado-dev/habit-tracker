// Edit habit (SPEC-00, T12; Figma "Edit habit · Specific days" and "· Any days").
// Name and weekly goal, saved as you type. The weekly goal is set two ways, switchable any time:
// Specific days (day buttons plus Every day, Weekdays, Weekends; minimum 1) or Any days (1 to 7).
// Icon and color pickers are designed in Figma and built in MVP, so they are not here yet.
// Remove goes back to Habits, which shows the Undo bar.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { setRemoved } from '@/features/habits/undoRemove';
import {
  DAY_LABELS,
  matchingPreset,
  PRESETS,
  resultLine,
  switchGoal,
  toggleDay,
} from '@/features/habits/weeklyGoal';
import { MAX_TIMES, MIN_TIMES } from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { WeeklyGoal, Weekday } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const TIMES = Array.from({ length: MAX_TIMES - MIN_TIMES + 1 }, (_, i) => MIN_TIMES + i);

export default function EditHabitScreen() {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const { state, dispatch } = useTracker();
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = state.habits.findIndex((h) => h.id === id);
  const habit = index >= 0 ? state.habits[index] : undefined;
  // The days picked before switching to Any days, so switching back brings them back.
  const lastDays = useRef<Weekday[] | undefined>(
    habit?.goal.kind === 'specificDays' ? habit.goal.days : undefined,
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/habits'));

  if (!habit) {
    return (
      <SafeAreaView style={styles.screen} testID="edit-habit-missing">
        <View style={styles.content}>
          <BackButton onPress={goBack} />
          <Text style={styles.body}>This habit is gone.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const goal = habit.goal;
  const canRemove = state.habits.length > 1;
  const setGoal = (next: WeeklyGoal) => {
    if (next.kind === 'specificDays') lastDays.current = next.days;
    dispatch({ type: 'setGoal', habitId: habit.id, goal: next });
  };

  const remove = () => {
    if (!canRemove) return;
    setRemoved({ habit, index });
    dispatch({ type: 'removeHabit', habitId: habit.id });
    goBack();
  };

  const preset = goal.kind === 'specificDays' ? matchingPreset(goal.days) : null;

  return (
    <SafeAreaView style={styles.screen} testID="edit-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackButton onPress={goBack} />
        <Text style={styles.title} accessibilityRole="header">
          Edit habit
        </Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={habit.name}
          onChangeText={(name) => dispatch({ type: 'renameHabit', habitId: habit.id, name })}
          style={styles.input}
          placeholder="Habit name"
          placeholderTextColor={c.onSurfaceMuted}
          maxLength={40}
          returnKeyType="done"
          testID="edit-habit-name"
          accessibilityLabel="Habit name"
        />
        {!habit.name.trim() ? (
          <Text style={styles.hint} testID="edit-habit-name-hint">
            Give this habit a name.
          </Text>
        ) : null}

        <Text style={styles.label}>WEEKLY GOAL</Text>
        <View style={styles.segment} accessibilityRole="radiogroup">
          {(
            [
              ['specificDays', 'Specific days'],
              ['anyDays', 'Any days'],
            ] as const
          ).map(([kind, label]) => {
            const on = goal.kind === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => setGoal(switchGoal(goal, kind, lastDays.current))}
                style={[styles.segmentItem, on && styles.selected]}
                testID={`edit-goal-${kind}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label}
              >
                <Text style={[styles.chipText, on && styles.selectedText]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {goal.kind === 'specificDays' ? (
          <>
            <View style={styles.wrapRow}>
              {PRESETS.map((p) => {
                const on = preset === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setGoal({ kind: 'specificDays', days: p.days })}
                    style={[styles.pill, on && styles.selected]}
                    testID={`edit-preset-${p.key}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={p.label}
                  >
                    <Text style={[styles.chipText, on && styles.selectedText]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.circleRow}>
              {DAY_LABELS.map(({ day, short, name }) => {
                const on = goal.days.includes(day);
                const onlyDay = on && goal.days.length === 1;
                return (
                  <Pressable
                    key={day}
                    onPress={() =>
                      setGoal({ kind: 'specificDays', days: toggleDay(goal.days, day) })
                    }
                    disabled={onlyDay}
                    style={[styles.circle, on && styles.selected]}
                    testID={`edit-day-${day}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: onlyDay }}
                    accessibilityLabel={name}
                    accessibilityHint={onlyDay ? 'At least one day is needed' : undefined}
                  >
                    <Text style={[styles.chipText, on && styles.selectedText]}>{short}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.body}>How many times a week?</Text>
            <View style={styles.circleRow}>
              {TIMES.map((n) => {
                const on = goal.timesPerWeek === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setGoal({ kind: 'anyDays', timesPerWeek: n })}
                    style={[styles.circle, on && styles.selected]}
                    testID={`edit-times-${n}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${n} ${n === 1 ? 'time' : 'times'} a week`}
                  >
                    <Text style={[styles.chipText, on && styles.selectedText]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.result} testID="edit-goal-result" accessibilityLiveRegion="polite">
          {resultLine(goal)}
        </Text>

        <View style={styles.spacer} />

        <Pressable
          onPress={remove}
          disabled={!canRemove}
          style={({ pressed }) => [
            styles.remove,
            !canRemove && styles.disabled,
            pressed && styles.pressed,
          ]}
          testID="edit-habit-remove"
          accessibilityRole="button"
          accessibilityLabel={`Remove ${habit.name || 'habit'}`}
          accessibilityState={{ disabled: !canRemove }}
        >
          <Text style={styles.removeText}>Remove habit</Text>
        </Pressable>
        {!canRemove ? (
          <Text style={styles.hint} testID="edit-habit-last">
            You need at least one habit.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={styles.back}
      testID="edit-habit-back"
      accessibilityRole="button"
      accessibilityLabel="Back to Habits"
    >
      <Text style={styles.backText}>‹ Habits</Text>
    </Pressable>
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
      flexGrow: 1,
      padding: space.lg,
      gap: space.md,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    title: { ...textStyle('display'), color: c.onSurface, marginBottom: space.sm },
    label: { ...textStyle('caption'), color: c.onSurfaceMuted, marginTop: space.sm },
    body: { ...textStyle('body'), color: c.onSurface },
    hint: { ...textStyle('caption'), color: c.onSurfaceMuted },
    input: {
      ...textStyle('body'),
      minHeight: MIN_TAP_SIZE + space.sm,
      paddingHorizontal: space.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.onSurface,
    },
    segment: {
      flexDirection: 'row',
      padding: space.xs,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceDim,
    },
    segmentItem: {
      flex: 1,
      minHeight: MIN_TAP_SIZE,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    pill: {
      minHeight: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      borderRadius: radius.pill,
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    circleRow: { flexDirection: 'row', justifyContent: 'space-between' },
    circle: {
      width: MIN_TAP_SIZE,
      height: MIN_TAP_SIZE,
      borderRadius: MIN_TAP_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    // chip-selected (design-system.md): near-black in light, near-white in dark.
    selected: { backgroundColor: c.onSurface, borderColor: c.onSurface },
    chipText: { ...textStyle('label'), color: c.onSurface },
    selectedText: { color: c.surfaceSheet },
    result: { ...textStyle('habitName'), color: c.onSurface },
    spacer: { flexGrow: 1, minHeight: space.xl },
    remove: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    removeText: { ...textStyle('label'), color: c.danger },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
  });
