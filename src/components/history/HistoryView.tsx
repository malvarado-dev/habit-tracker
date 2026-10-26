// History (P2-18a, #89; boards "History, today selected" and "History, locked day selected").
// A month calendar, Sunday to Saturday, with streak days joined in a lemon band that wraps across
// weeks, the current and best streak, and under it the selected day: its title, whether it can
// still change, and only the habits logged and slips counted that day. Editable days have − / +,
// Done with Undo, the slip stepper, and "+ Log a habit I missed" (P2-18b).
// Used on the phone History screen and in the wide layout.

import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BadHabitsTray } from '@/components/BadHabitsTray';
import { HabitCard } from '@/components/HabitCard';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { cardEdge, history as size, type ThemeColors } from '@/design/tokens';
import {
  dayCellLabel,
  dayHeaderText,
  dayTitle,
  monthGrid,
  monthLimits,
  monthTitle,
  stepMonth,
  streakBand,
  streaks,
  streakText,
  weekdayLetters,
  type BandPart,
  type DayCell,
} from '@/features/history/historyModel';
import { noteQuietCoins } from '@/features/coins/coinOrigin';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { BadHabit } from '@/rules/badHabits';
import { existsOn, isDue, isOptional, timesPerDay, type Habit } from '@/rules/habits';
import { slipCount } from '@/rules/badHabits';
import { monthOf, type DateKey } from '@/rules/dates';
import { linkedBadHabit, dayLogs } from '@/rules/linked';
import { allHabits } from '@/rules/locking';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { useShowUndo } from './HistoryEditScope';

export function HistoryView() {
  const styles = useStyles();
  const { state, today, oldestDay, openDays } = useTracker();
  const [month, setMonth] = useState(() => monthOf(today));
  const [selected, setSelected] = useState<DateKey>(today);

  const weeks = monthGrid(month, state, today, oldestDay);
  const band = streakBand(weeks, state);
  const { canPrev, canNext } = monthLimits(month, state.log, today, oldestDay);
  const step = (by: 1 | -1) => setMonth((m) => stepMonth(m, by, state.log, today, oldestDay));

  return (
    <View style={styles.wrap} testID="history-view">
      <View style={styles.panel}>
        <View style={styles.header}>
          <ArrowButton
            label="Previous month"
            glyph="‹"
            disabled={!canPrev}
            testID="history-prev-month"
            onPress={() => step(-1)}
          />
          <View style={styles.titleBlock}>
            <Text style={styles.month} accessibilityRole="header" testID="history-month">
              {monthTitle(month)}
            </Text>
            <Text style={styles.streak} testID="history-streak">
              {streakText(streaks(state, today))}
            </Text>
          </View>
          <ArrowButton
            label="Next month"
            glyph="›"
            disabled={!canNext}
            testID="history-next-month"
            onPress={() => step(1)}
          />
        </View>

        <View style={styles.row} importantForAccessibility="no-hide-descendants">
          {weekdayLetters().map((letter, i) => (
            <Text key={i} style={styles.weekday}>
              {letter}
            </Text>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={week[0]!.date} style={styles.row}>
            {week.map((cell, i) => (
              <DayCellView
                key={cell.date}
                cell={cell}
                band={band[w]![i]!}
                selected={cell.date === selected}
                onSelect={setSelected}
              />
            ))}
          </View>
        ))}
      </View>

      <DayDetails date={selected} today={today} openDays={openDays} />
    </View>
  );
}

/** The selected day: title, status, and only what was logged that day. */
function DayDetails({
  date,
  today,
  openDays,
}: {
  date: DateKey;
  today: DateKey;
  openDays: number;
}) {
  const styles = useStyles();
  const { state, dispatch } = useTracker();
  const showUndo = useShowUndo();
  const status = dayHeaderText(date, today, state.lockedThrough, openDays);
  const editable = !status.locked;
  const [missedOpen, setMissedOpen] = useState(false);
  // A slip counted down to 0 keeps its chip until the stepper closes (#108).
  const [keep, setKeep] = useState<string[]>([]);

  const rows = allHabits(state).map((habit) => ({
    habit,
    ...dayLogs(habit, state.log, state.slips, state.badHabits, date),
  }));
  const logged = rows.filter((h) => h.total > 0);
  const missed = rows.filter(
    (h) =>
      h.total === 0 &&
      existsOn(h.habit, date) &&
      (isDue(h.habit, date) || isOptional(h.habit, date)),
  );
  const slipped = state.badHabits.filter(
    (b) => slipCount(state.slips, date, b.id) > 0 || keep.includes(b.id),
  );
  const nothing = logged.length === 0 && slipped.length === 0;

  // Every History edit earns Coins quietly and shows the Undo bar.
  const log = (habit: Habit) => {
    noteQuietCoins();
    dispatch({ type: 'logHabit', date, habitId: habit.id });
    showUndo({
      text: `${habit.name} logged`,
      run: () => {
        noteQuietCoins();
        dispatch({ type: 'undoLog', date, habitId: habit.id });
      },
    });
  };
  const unlog = (habit: Habit) => {
    noteQuietCoins();
    dispatch({ type: 'undoLog', date, habitId: habit.id });
    showUndo({
      text: `${habit.name} log removed`,
      run: () => {
        noteQuietCoins();
        dispatch({ type: 'logHabit', date, habitId: habit.id });
      },
    });
  };
  const setSlips = (bad: BadHabit, count: number) => {
    const before = slipCount(state.slips, date, bad.id);
    const next = Math.max(0, count);
    if (next === before) return;
    setKeep((k) => (k.includes(bad.id) ? k : [...k, bad.id]));
    noteQuietCoins();
    dispatch({ type: 'setSlips', date, badHabitId: bad.id, count: next });
    showUndo({
      text: `${bad.name}: ${next}`,
      run: () => {
        noteQuietCoins();
        dispatch({ type: 'setSlips', date, badHabitId: bad.id, count: before });
      },
    });
  };

  return (
    <View style={styles.day} testID="history-day-details">
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle} accessibilityRole="header" testID="history-day-title">
          {dayTitle(date, today)}
        </Text>
        <Text style={styles.dayStatus} testID="history-day-status">
          {status.text}
        </Text>
      </View>

      {nothing ? (
        <Text style={styles.empty} testID="history-day-empty">
          Nothing logged this day.
        </Text>
      ) : null}

      {logged.map(({ habit, gold, slate }) => {
        const linked = linkedBadHabit(habit, state.badHabits);
        const once = timesPerDay(habit) <= 1;
        const name = habit.name.trim() || 'Untitled habit';
        let trailing: ReactNode = null;
        if (editable && once) {
          trailing = (
            <RoundButton
              glyph="↶"
              label={`Undo ${name}`}
              testID={`history-undo-${habit.id}`}
              onPress={() =>
                gold > 0 ? unlog(habit) : linked ? setSlips(linked, slate - 1) : undefined
              }
            />
          );
        } else if (editable) {
          trailing = (
            <View style={styles.stepper}>
              <RoundButton
                glyph="−"
                label={`One less ${name}`}
                testID={`history-minus-${habit.id}`}
                disabled={gold === 0}
                onPress={() => unlog(habit)}
              />
              <RoundButton
                glyph="+"
                label={`One more ${name}`}
                testID={`history-plus-${habit.id}`}
                dark
                disabled={gold + slate >= timesPerDay(habit)}
                onPress={() => log(habit)}
              />
            </View>
          );
        }
        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            count={gold}
            slate={slate}
            linked={linked ? { name: linked.name, count: slate } : undefined}
            onLog={() => {}}
            locked={status.locked}
            readOnly
            trailing={trailing}
          />
        );
      })}

      {slipped.length > 0 ? (
        <View style={status.locked && styles.dimmed}>
          <BadHabitsTray
            badHabits={slipped}
            countOf={(id) => slipCount(state.slips, date, id)}
            onSlip={() => {}}
            onSetCount={(bad, n) => setSlips(bad, n)}
            readOnly={!editable}
            tapOpensStepper
            onStepperClose={() => setKeep([])}
          />
        </View>
      ) : null}

      {editable && missed.length > 0 ? (
        <>
          <Pressable
            onPress={() => setMissedOpen((o) => !o)}
            style={styles.missedLink}
            testID="history-missed-toggle"
            accessibilityRole="button"
            accessibilityState={{ expanded: missedOpen }}
          >
            <Text style={styles.missedText}>
              {missedOpen ? '− Hide missed habits' : '+ Log a habit I missed'}
            </Text>
          </Pressable>
          {missedOpen ? (
            <View style={styles.missedBox} testID="history-missed-list">
              <Text style={styles.empty}>Not logged this day. Tap one to log it.</Text>
              {missed.map(({ habit }) => (
                <HabitCard key={habit.id} habit={habit} count={0} onLog={() => log(habit)} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/** A round 44 pt button on a History card: − / + steppers and Undo. */
function RoundButton(props: {
  glyph: string;
  label: string;
  testID: string;
  onPress: () => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[styles.round, props.dark && styles.roundDark, props.disabled && styles.faint]}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: !!props.disabled }}
    >
      <Text style={[styles.roundText, props.dark && styles.roundTextDark]}>{props.glyph}</Text>
    </Pressable>
  );
}

function ArrowButton(props: {
  label: string;
  glyph: string;
  disabled: boolean;
  testID: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[styles.arrow, props.disabled && styles.faint]}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
    >
      <Text style={styles.arrowText}>{props.glyph}</Text>
    </Pressable>
  );
}

function DayCellView(props: {
  cell: DayCell;
  band: BandPart;
  selected: boolean;
  onSelect: (date: DateKey) => void;
}) {
  const { cell, band, selected } = props;
  const styles = useStyles();
  const bandStyle =
    band === 'none'
      ? null
      : [
          styles.band,
          (band === 'start' || band === 'single') && styles.bandStart,
          (band === 'end' || band === 'single') && styles.bandEnd,
        ];

  const number = (
    <View
      style={[
        styles.marker,
        cell.isToday && !selected && styles.todayRing,
        selected && styles.selected,
      ]}
    >
      <Text style={[styles.dayNumber, selected && styles.selectedText]}>{cell.dayNumber}</Text>
    </View>
  );

  // Days from other months are left blank, like the boards.
  if (cell.kind === 'outside') return <View style={styles.cell} />;

  const tappable = cell.kind === 'day';
  const label =
    dayCellLabel(cell) +
    (cell.isToday ? ', today' : '') +
    (band !== 'none' ? ', check-in day' : '');
  return (
    <Pressable
      onPress={() => props.onSelect(cell.date)}
      disabled={!tappable}
      style={[styles.cell, !tappable && styles.faint]}
      testID={`history-day-${cell.date}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !tappable, selected }}
    >
      {bandStyle ? <View style={bandStyle} testID={`history-band-${cell.date}`} /> : null}
      {number}
    </Pressable>
  );
}

function useStyles() {
  const { colors, scheme } = useTheme();
  return useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    panel: {
      backgroundColor: c.surface,
      borderRadius: size.panelRadius,
      ...cardEdge(scheme, c.border),
      padding: space.md,
      gap: space.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: space.sm,
    },
    titleBlock: { alignItems: 'center', flex: 1 },
    month: { ...textStyle('habitName', '700'), color: c.onSurface },
    streak: { ...textStyle('caption'), color: c.onSurfaceMuted },
    arrow: {
      width: size.arrowSize,
      height: size.arrowSize,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowText: { ...textStyle('title'), color: c.onSurface },
    row: { flexDirection: 'row' },
    weekday: {
      ...textStyle('caption', '700'),
      flex: 1,
      textAlign: 'center',
      color: c.onSurfaceMuted,
    },
    // 44 pt tall at least, so every day is an easy tap.
    cell: {
      flex: 1,
      minHeight: size.arrowSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    band: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: (size.arrowSize - size.dayMarker) / 2,
      height: size.dayMarker,
      backgroundColor: withAlpha(c.primary, size.bandAlpha),
    },
    bandStart: {
      left: space.xs,
      borderTopLeftRadius: radius.pill,
      borderBottomLeftRadius: radius.pill,
    },
    bandEnd: {
      right: space.xs,
      borderTopRightRadius: radius.pill,
      borderBottomRightRadius: radius.pill,
    },
    marker: {
      width: size.dayMarker,
      height: size.dayMarker,
      borderRadius: radius.pill,
      borderWidth: size.todayBorder,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayRing: { borderColor: c.onSurface },
    selected: { backgroundColor: c.onSurface, borderColor: c.onSurface },
    selectedText: { color: c.surface },
    dayNumber: { ...textStyle('caption', '700'), color: c.onSurface },
    faint: { opacity: size.faintOpacity },
    day: { gap: space.sm },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    dayTitle: { ...textStyle('habitName', '700'), color: c.onSurface },
    dayStatus: { ...textStyle('caption'), color: c.onSurfaceMuted },
    empty: { ...textStyle('caption'), color: c.onSurfaceMuted },
    dimmed: { opacity: size.lockedCardOpacity },
    stepper: { flexDirection: 'row', gap: space.sm, marginLeft: space.sm },
    round: {
      width: MIN_TAP_SIZE,
      height: MIN_TAP_SIZE,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: space.sm,
    },
    roundDark: { backgroundColor: c.onSurface },
    roundText: { ...textStyle('title'), color: c.onSurface },
    roundTextDark: { color: c.primary },
    missedLink: { alignSelf: 'center', minHeight: MIN_TAP_SIZE, justifyContent: 'center' },
    missedText: {
      ...textStyle('habitName', '700'),
      color: c.onSurface,
      textDecorationLine: 'underline',
    },
    missedBox: {
      gap: space.sm,
      padding: space.md,
      borderRadius: size.panelRadius,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.border,
    },
  });
