// The name field and weekly goal picker shared by Edit habit and Add habit (SPEC-00, T12, T13).
// The screen owns the values; this only draws them and reports changes.
// Test IDs start with the screen's prefix, like "edit-habit-name" or "add-habit-name".

import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { MAX_NAME_LENGTH, nameCounter } from '@/features/habits/habitName';
import {
  DAY_LABELS,
  matchingPreset,
  PRESETS,
  resultLine,
  switchGoal,
  toggleDay,
} from '@/features/habits/weeklyGoal';
import { MAX_TIMES, MIN_TIMES } from '@/features/tracker/state';
import type { WeeklyGoal, Weekday } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const TIMES = Array.from({ length: MAX_TIMES - MIN_TIMES + 1 }, (_, i) => MIN_TIMES + i);

export function HabitForm(props: {
  /** "edit" or "add": the start of every test ID. */
  idPrefix: string;
  name: string;
  onNameChange: (name: string) => void;
  /** Why the name can't be saved, or "" when it's fine. */
  nameHint: string;
  goal: WeeklyGoal;
  onGoalChange: (goal: WeeklyGoal) => void;
}) {
  const { idPrefix: p, name, goal } = props;
  const styles = useStyles();
  const { colors: c } = useTheme();
  // The days picked before switching to Any days, so switching back brings them back.
  const lastDays = useRef<Weekday[] | undefined>(
    goal.kind === 'specificDays' ? goal.days : undefined,
  );

  const setGoal = (next: WeeklyGoal) => {
    if (next.kind === 'specificDays') lastDays.current = next.days;
    props.onGoalChange(next);
  };
  const preset = goal.kind === 'specificDays' ? matchingPreset(goal.days) : null;
  const counter = nameCounter(name);

  return (
    <>
      <Text style={styles.label}>NAME</Text>
      <TextInput
        value={name}
        onChangeText={props.onNameChange}
        style={styles.input}
        placeholder="Habit name"
        placeholderTextColor={c.onSurfaceMuted}
        maxLength={MAX_NAME_LENGTH}
        returnKeyType="done"
        testID={`${p}-habit-name`}
        accessibilityLabel="Habit name"
        accessibilityHint={`Up to ${MAX_NAME_LENGTH} characters`}
      />
      {props.nameHint || counter ? (
        <View style={styles.hintRow}>
          <Text
            style={styles.hint}
            testID={`${p}-habit-name-hint`}
            accessibilityLiveRegion="polite"
          >
            {props.nameHint}
          </Text>
          {counter ? (
            <Text style={styles.hint} testID={`${p}-habit-name-count`}>
              {counter}
            </Text>
          ) : null}
        </View>
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
              testID={`${p}-goal-${kind}`}
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
            {PRESETS.map((pr) => {
              const on = preset === pr.key;
              return (
                <Pressable
                  key={pr.key}
                  onPress={() => setGoal({ kind: 'specificDays', days: pr.days })}
                  style={[styles.pill, on && styles.selected]}
                  testID={`${p}-preset-${pr.key}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={pr.label}
                >
                  <Text style={[styles.chipText, on && styles.selectedText]}>{pr.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.circleRow}>
            {DAY_LABELS.map(({ day, short, name: dayName }) => {
              const on = goal.days.includes(day);
              const onlyDay = on && goal.days.length === 1;
              return (
                <Pressable
                  key={day}
                  onPress={() => setGoal({ kind: 'specificDays', days: toggleDay(goal.days, day) })}
                  disabled={onlyDay}
                  style={[styles.circle, on && styles.selected]}
                  testID={`${p}-day-${day}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled: onlyDay }}
                  accessibilityLabel={dayName}
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
                  testID={`${p}-times-${n}`}
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

      <Text style={styles.result} testID={`${p}-goal-result`} accessibilityLiveRegion="polite">
        {resultLine(goal)}
      </Text>
    </>
  );
}

/** "‹ Habits" style back link. The label names the screen Back goes to. */
export function BackLink(props: { label: string; onPress: () => void; testID: string }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={props.onPress}
      style={styles.back}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${props.label}`}
    >
      <Text style={styles.backText}>‹ {props.label}</Text>
    </Pressable>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    label: { ...textStyle('caption'), color: c.onSurfaceMuted, marginTop: space.sm },
    body: { ...textStyle('body'), color: c.onSurface },
    hintRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
    hint: { ...textStyle('caption'), color: c.onSurfaceMuted, flexShrink: 1 },
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
  });
