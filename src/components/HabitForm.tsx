// The name field and schedule picker shared by Edit habit and Add habit (SPEC-00, T12, T13).
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
  switchSchedule,
  toggleDay,
} from '@/features/habits/schedule';
import type { Schedule, Weekday } from '@/rules/habits';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

export function HabitForm(props: {
  /** "edit" or "add": the start of every test ID. */
  idPrefix: string;
  name: string;
  onNameChange: (name: string) => void;
  /** Why the name can't be saved, or "" when it's fine. */
  nameHint: string;
  schedule: Schedule;
  onScheduleChange: (schedule: Schedule) => void;
}) {
  const { idPrefix: p, name, schedule } = props;
  const styles = useStyles();
  const { colors: c } = useTheme();
  // The days picked before switching to Any days, so switching back brings them back.
  const lastDays = useRef<Weekday[] | undefined>(
    schedule.kind === 'specificDays' ? schedule.days : undefined,
  );

  const setSchedule = (next: Schedule) => {
    if (next.kind === 'specificDays') lastDays.current = next.days;
    props.onScheduleChange(next);
  };
  const preset = schedule.kind === 'specificDays' ? matchingPreset(schedule.days) : null;
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
          const on = schedule.kind === kind;
          return (
            <Pressable
              key={kind}
              onPress={() => setSchedule(switchSchedule(schedule, kind, lastDays.current))}
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

      {schedule.kind === 'specificDays' ? (
        <>
          <View style={styles.wrapRow}>
            {PRESETS.map((pr) => {
              const on = preset === pr.key;
              return (
                <Pressable
                  key={pr.key}
                  onPress={() => setSchedule({ kind: 'specificDays', days: pr.days })}
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
              const on = schedule.days.includes(day);
              const onlyDay = on && schedule.days.length === 1;
              return (
                <Pressable
                  key={day}
                  onPress={() =>
                    setSchedule({ kind: 'specificDays', days: toggleDay(schedule.days, day) })
                  }
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
        <Text style={styles.body}>Not due on any day. Log it whenever you do it.</Text>
      )}

      <Text style={styles.result} testID={`${p}-goal-result`} accessibilityLiveRegion="polite">
        {resultLine(schedule)}
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
