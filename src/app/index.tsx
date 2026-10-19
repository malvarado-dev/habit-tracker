// Today, phone and tablet portrait (SPEC-00). The Background fills the whole screen with the
// critter standing near the top. Habit cards sit on a fixed, rounded habit sheet over the
// lower part; cards scroll inside the sheet and the Background stays put. No header; the
// subtle menu button sits top left. T10 builds the wide layout.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/Background';
import { Celebration, type CelebrationKind } from '@/components/Celebration';
import { Critter } from '@/components/Critter';
import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard, type GoalStyle } from '@/components/HabitCard';
import { MenuButton } from '@/components/MenuButton';
import { TestTools } from '@/components/TestTools';
import { tuning } from '@/config/tuning';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, type ThemeColors } from '@/design/tokens';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getRank } from '@/rules/rank';
import { getDailyResult, getWeekProgress, isDue, nextCheckIn, type CheckIn } from '@/rules/scoring';
import { getSkyLevel, getSkyTime } from '@/rules/sky';
import { space } from '@/theme';

export default function HomeScreen() {
  const styles = useStyles();
  const { state, dispatch, today } = useTracker();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const result = getDailyResult(state.habits, state.log, today);
  const skyLevel = getSkyLevel(result);
  const skyTime = getSkyTime(new Date().getHours());
  const todayLog = state.log[today] ?? {};

  // Temporary, not saved: Profile's Weekly goal style setting arrives in T11.
  const [goalStyle, setGoalStyle] = useState<GoalStyle>('ring');
  const [celebration, setCelebration] = useState<CelebrationKind | null>(null);

  const dayKey = !result.isComplete
    ? null
    : result.isRestDay
      ? `${today}-rest`
      : `${today}-${result.score === null ? 'none' : getRank(result.score)}`;

  // Don't replay a celebration for a day that was already finished when the app opened.
  const lastCelebrated = useRef<string | null>(dayKey);

  useEffect(() => {
    if (!dayKey || dayKey === lastCelebrated.current) return;
    const timer = setTimeout(() => {
      lastCelebrated.current = dayKey;
      setCelebration(
        result.isRestDay || result.score === null
          ? { type: 'rest' }
          : { type: 'rank', rank: getRank(result.score) },
      );
    }, tuning.celebrationDelayMs);
    return () => clearTimeout(timer);
  }, [dayKey, result.isRestDay, result.score]);

  const checkIn = (habitId: string, value: CheckIn | undefined, viaTap: boolean) => {
    dispatch(
      viaTap
        ? { type: 'tapHabit', date: today, habitId }
        : { type: 'setCheckIn', date: today, habitId, checkIn: value },
    );
  };

  const sheetTop = Math.round(height * todayLayout.sheetTopRatio);
  const critterWidth = Math.min(width * todayLayout.critterWidthRatio, todayLayout.critterMaxWidth);
  const critterHeight = critterWidth * (260 / 360);

  return (
    <View style={styles.screen} testID="today-screen">
      {/* The Background never scrolls; it sits behind everything. */}
      <Background time={skyTime} level={skyLevel} />

      <View
        style={[styles.critter, { top: sheetTop + todayLayout.critterOverlap - critterHeight }]}
        pointerEvents="box-none"
      >
        <Critter width={critterWidth} level={skyLevel} reactKey={JSON.stringify(todayLog)} />
      </View>

      <View style={[styles.menu, { top: insets.top + space.sm, left: insets.left + space.lg }]}>
        <MenuButton time={skyTime} />
      </View>

      <View style={[styles.sheet, { top: sheetTop }]} testID="habit-sheet">
        <View style={styles.sheetInner}>
          <EnergyBar checkedIn={result.checkedInCount} due={result.dueCount} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.cards, { paddingBottom: insets.bottom + space.xl }]}
            testID="habit-list"
          >
            {state.habits.map((habit) => {
              const current = todayLog[habit.id];
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  checkIn={current}
                  isDue={isDue(habit, state.log, today)}
                  progress={getWeekProgress(habit, state.log, today)}
                  goalStyle={goalStyle}
                  onTap={() => checkIn(habit.id, nextCheckIn(current), true)}
                  onSwipe={(value) => checkIn(habit.id, value, false)}
                />
              );
            })}
            <TestTools
              goalStyle={goalStyle}
              onGoalStyle={setGoalStyle}
              onNextDay={() => dispatch({ type: 'nextDay' })}
              onReset={() => {
                lastCelebrated.current = null;
                dispatch({ type: 'reset' });
              }}
            />
          </ScrollView>
        </View>
      </View>

      {celebration ? <Celebration kind={celebration} onClose={() => setCelebration(null)} /> : null}
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

// habit-sheet in design-spendio.md: solid sheet color, 28 pt top corners, 16 pt padding.
const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, overflow: 'hidden' },
    critter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    menu: { position: 'absolute' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
    sheetInner: {
      flex: 1,
      width: '100%',
      maxWidth: todayLayout.sheetMaxWidth,
      backgroundColor: c.surfaceSheet,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: space.lg,
      paddingHorizontal: space.lg,
      gap: space.md,
    },
    scroll: { flex: 1 },
    cards: { gap: space.md, paddingTop: space.xs },
  });
