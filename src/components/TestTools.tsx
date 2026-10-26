// Test tools (SPEC-00, T14, moved to its own screen in T17): prototype only. A Real / Test switch,
// the date, Bounce the pet (P2-11), and in Test only, Next day, Back to today, Reset (tap twice), Fill today, and the
// pet's Love and Confidence (P2-05, P2-13). Times per day for each habit (P2-08a) works in Real and Test, since
// there's no Edit habit setting for it yet. The bad habit Design 1 / Design 2 switch is a setting, not data (P2-10). Real is your real
// data on the real date; Test is a separate save, so History can be tried in full without
// touching real tracking. Theme lives in Profile, where the playtest records them; a Profile settings link
// opens it (T19).
//
// To remove after Stage 3:
// 1. Delete this file, testToolsText.ts, testTools.test.ts, TestModeBanner.tsx,
//    src/app/test-tools.tsx, features/tracker/modes.ts (and its test), and src/config/prototype.ts.
// 2. In SideMenu.tsx, delete the Test tools item and its divider.
// 3. In app/_layout.tsx, delete <TestModeBanner />.
// 4. In TrackerProvider.tsx, keep one tracker: load and save REAL_KEY directly, drop mode and
//    testTools. The real save shape (state.ts) has no test fields, so it doesn't change.
// To only hide it, set SHOW_TEST_TOOLS to false in src/config/prototype.ts.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { tuning } from '@/config/tuning';
import { BAD_HABIT_DESIGNS, BAD_HABIT_DESIGN_LABELS } from '@/features/settings/settings';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { requestPetReaction } from '@/scene/petMoments';
import { MAX_STAT, MIN_STAT, type PetStat } from '@/rules/petStats';
import { timesPerDay } from '@/rules/habits';
import type { Mode } from '@/features/tracker/modes';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { modeHelpText, pretendDateText, realDateText } from './testToolsText';

const MODES: { key: Mode; label: string }[] = [
  { key: 'real', label: 'Real' },
  { key: 'test', label: 'Test' },
];

export function TestTools() {
  const styles = useStyles();
  const { mode, setMode, today, testTools, state, dispatch } = useTracker();
  const maxTimes = tuning.activityBar.timesPerDayMax;
  const [confirmReset, setConfirmReset] = useState(false);
  const { badHabitDesign, setBadHabitDesign } = useSettings();
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
                aria-checked={on}
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

      <Pressable
        onPress={() => router.push({ pathname: '/profile', params: { from: 'test-tools' } })}
        style={styles.button}
        testID="test-tools-profile-link"
        accessibilityRole="link"
        accessibilityLabel="Profile settings and theme"
      >
        <Text style={styles.buttonText}>Profile settings ›</Text>
      </Pressable>

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
            accessibilityLabel="Back to today, keeps your test logs"
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
          <Pressable
            onPress={testTools.fillToday}
            style={styles.button}
            testID="fill-today-button"
            accessibilityRole="button"
            accessibilityLabel="Fill today, finishes every habit on the pretend day"
          >
            <Text style={styles.buttonText}>Fill today</Text>
          </Pressable>
        </View>
      ) : null}

      {mode === 'test' ? (
        <>
          <StatStepper
            stat="confidence"
            label="Pet confidence"
            value={testTools.stats.confidence}
            onSet={(v) => testTools.setStat('confidence', v)}
          />
          <StatStepper
            stat="love"
            label="Pet love"
            value={testTools.stats.love}
            onSet={(v) => testTools.setStat('love', v)}
          />
        </>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.heading} accessibilityRole="header">
          Pet motion
        </Text>
        <Text style={styles.help}>Goes back to Today and plays the pet reaction, for review.</Text>
        <Pressable
          onPress={() => {
            requestPetReaction();
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          style={styles.button}
          testID="pet-bounce-button"
          accessibilityRole="button"
          accessibilityLabel="Bounce the pet, goes back to Today"
        >
          <Text style={styles.buttonText}>Bounce the pet</Text>
        </Pressable>
      </View>

      <View style={styles.section} testID="times-per-day">
        <Text style={styles.heading} accessibilityRole="header">
          Times per day
        </Text>
        <Text style={styles.help}>
          How many logs finish each habit. Above 1, the card shows a ring.
        </Text>
        {state.habits.map((habit) => {
          const times = timesPerDay(habit);
          const set = (next: number) =>
            dispatch({ type: 'setTimesPerDay', habitId: habit.id, times: next });
          const name = habit.name || 'Habit';
          return (
            <View
              key={habit.id}
              style={styles.stepRow}
              accessibilityRole="adjustable"
              accessibilityLabel={`${name}, times per day`}
              aria-valuemin={1}
              aria-valuemax={maxTimes}
              aria-valuenow={times}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) =>
                set(times + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
              }
            >
              <Text style={[styles.date, styles.stepName]} numberOfLines={1}>
                {name}
              </Text>
              <Pressable
                onPress={() => set(times - 1)}
                disabled={times <= 1}
                style={[styles.button, times <= 1 && styles.off]}
                testID={`times-per-day-down-${habit.id}`}
                accessibilityLabel={`Fewer times a day for ${name}`}
              >
                <Text style={styles.buttonText}>−</Text>
              </Pressable>
              <Text style={styles.date} testID={`times-per-day-value-${habit.id}`}>
                {times}
              </Text>
              <Pressable
                onPress={() => set(times + 1)}
                disabled={times >= maxTimes}
                style={[styles.button, times >= maxTimes && styles.off]}
                testID={`times-per-day-up-${habit.id}`}
                accessibilityLabel={`More times a day for ${name}`}
              >
                <Text style={styles.buttonText}>+</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading} accessibilityRole="header">
          Bad habits layout
        </Text>
        <View
          style={styles.choices}
          accessibilityRole="radiogroup"
          accessibilityLabel="Bad habits layout"
        >
          {BAD_HABIT_DESIGNS.map((d) => {
            const on = d === badHabitDesign;
            return (
              <Pressable
                key={d}
                onPress={() => setBadHabitDesign(d)}
                style={[styles.chip, on && styles.chipOn]}
                testID={`bad-habit-${d}`}
                accessibilityRole="radio"
                aria-checked={on}
                accessibilityLabel={BAD_HABIT_DESIGN_LABELS[d]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {BAD_HABIT_DESIGN_LABELS[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
      alignSelf: 'flex-start',
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
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    stepName: { flex: 1 },
    confirm: { borderColor: c.danger },
    confirmText: { color: c.danger },
  });

/** A Test tools stepper for one pet stat (P2-13). Worked-out value shown, nudged in steps. */
function StatStepper({
  stat,
  label,
  value,
  onSet,
}: {
  stat: PetStat;
  label: string;
  value: number;
  onSet: (value: number) => void;
}) {
  const styles = useStyles();
  const step = tuning.pet.statStep;
  const name = label.replace('Pet ', '');
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        {label}
      </Text>
      <View
        style={styles.row}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        aria-valuemin={MIN_STAT}
        aria-valuemax={MAX_STAT}
        aria-valuenow={value}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onSet(value + (e.nativeEvent.actionName === 'increment' ? step : -step))
        }
      >
        <Pressable
          onPress={() => onSet(value - step)}
          disabled={value <= MIN_STAT}
          style={[styles.button, value <= MIN_STAT && styles.off]}
          testID={`${stat}-down`}
          accessibilityLabel={`Lower ${name}`}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.date} testID={`${stat}-value`}>
          {value}
        </Text>
        <Pressable
          onPress={() => onSet(value + step)}
          disabled={value >= MAX_STAT}
          style={[styles.button, value >= MAX_STAT && styles.off]}
          testID={`${stat}-up`}
          accessibilityLabel={`Raise ${name}`}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
