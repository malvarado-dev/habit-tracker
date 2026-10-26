// History (SPEC-00, T16): a month calendar, Sunday to Saturday. Check-in days (the Activity Bar
// filled) are lemon with a smiling face, Rest days say Rest. Used on the phone History screen and
// on wide. Tapping today or a past day opens the Day screen. The week panel went with weekly goals
// (P2-08a); P2-18 (#89) rebuilds this screen with the streak band.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { history as size, type ThemeColors } from '@/design/tokens';
import {
  dayCellLabel,
  monthGrid,
  monthLimits,
  monthTitle,
  stepMonth,
  weekdayLetters,
  type DayCell,
} from '@/features/history/historyModel';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { monthOf, type DateKey } from '@/rules/dates';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { CritterFace } from './CritterFace';

type Props = {
  onOpenDay: (date: DateKey) => void;
};

export function HistoryView({ onOpenDay }: Props) {
  const styles = useStyles();
  const { state, today, oldestDay } = useTracker();
  const [month, setMonth] = useState(() => monthOf(today));

  const weeks = monthGrid(month, state, today, oldestDay);
  const { canPrev, canNext } = monthLimits(month, state.log, today, oldestDay);
  const open = onOpenDay;

  return (
    <View style={styles.wrap} testID="history-view">
      <View style={styles.header}>
        <ArrowButton
          label="Previous month"
          glyph="‹"
          disabled={!canPrev}
          testID="history-prev-month"
          onPress={() => setMonth((m) => stepMonth(m, -1, state.log, today, oldestDay))}
        />
        <Text style={styles.month} accessibilityRole="header" testID="history-month">
          {monthTitle(month)}
        </Text>
        <ArrowButton
          label="Next month"
          glyph="›"
          disabled={!canNext}
          testID="history-next-month"
          onPress={() => setMonth((m) => stepMonth(m, 1, state.log, today, oldestDay))}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.row} importantForAccessibility="no-hide-descendants">
          {weekdayLetters().map((letter, i) => (
            <Text key={i} style={styles.weekday}>
              {letter}
            </Text>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={week[0]!.date} style={styles.row}>
            {week.map((cell) => (
              <DayCellView key={cell.date} cell={cell} onOpen={open} />
            ))}
          </View>
        ))}
      </View>
    </View>
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

function DayCellView({ cell, onOpen }: { cell: DayCell; onOpen: (date: DateKey) => void }) {
  const styles = useStyles();
  const result = cell.result;
  const isS = result?.outcome === 'checkIn';
  const faint = cell.kind !== 'day';

  const content = (
    <>
      <Text style={[styles.dayNumber, isS && styles.onLemon]}>{cell.dayNumber}</Text>
      <View style={styles.faceSlot}>
        {result?.outcome === 'checkIn' ? (
          <CritterFace mood="big" width={size.faceWidth} testID={`history-face-${cell.date}`} />
        ) : result?.outcome === 'rest' ? (
          <Text style={styles.rest}>Rest</Text>
        ) : null}
      </View>
    </>
  );

  const cellStyle = [
    styles.cell,
    isS && styles.lemon,
    cell.isToday && styles.today,
    faint && styles.faint,
  ];

  // Days from other months are just shown faint; they aren't part of this month.
  if (cell.kind === 'outside') {
    return (
      <View style={cellStyle} importantForAccessibility="no-hide-descendants">
        {content}
      </View>
    );
  }

  // Future days, and in Test days older than its window, are faint and can't be opened.
  const openable = cell.kind === 'day';
  return (
    <Pressable
      onPress={() => onOpen(cell.date)}
      disabled={!openable}
      style={({ pressed }) => [...cellStyle, pressed && styles.pressed]}
      testID={`history-day-${cell.date}`}
      accessibilityRole="button"
      accessibilityLabel={dayCellLabel(cell) + (cell.isToday ? ', today' : '')}
      accessibilityState={{ disabled: !openable }}
    >
      {content}
    </Pressable>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    month: { ...textStyle('habitName'), color: c.onSurface },
    arrow: {
      width: MIN_TAP_SIZE,
      height: MIN_TAP_SIZE,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowText: { ...textStyle('title'), color: c.onSurface },
    panel: {
      backgroundColor: c.surface,
      borderRadius: size.panelRadius,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: space.md,
      paddingHorizontal: space.sm,
      gap: space.xs,
    },
    row: {
      flexDirection: 'row',
      gap: size.cellGap,
      padding: size.cellGap,
      borderRadius: size.weekRowRadius,
    },
    weekday: {
      ...textStyle('caption', '700'),
      flex: 1,
      textAlign: 'center',
      color: c.onSurfaceMuted,
    },
    cell: {
      flex: 1,
      minHeight: size.cellMinHeight,
      borderRadius: size.cellRadius,
      borderWidth: size.todayBorder,
      borderColor: 'transparent',
      alignItems: 'center',
      paddingTop: space.xs,
      gap: 2,
    },
    lemon: { backgroundColor: c.primary },
    today: { borderColor: c.onSurface },
    faint: { opacity: size.faintOpacity },
    pressed: { opacity: 0.7 },
    dayNumber: { ...textStyle('caption', '700'), color: c.onSurfaceMuted },
    onLemon: { color: c.onPrimary },
    faceSlot: { minHeight: size.faceWidth, alignItems: 'center', justifyContent: 'flex-end' },
    rest: { ...textStyle('caption', '700'), color: c.onSurfaceMuted },
  });
