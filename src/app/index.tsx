// Main screen: the critter on top (Finch-style) and habit cards below. On wide screens,
// habits move to the left and the critter to the right, like v0.

import { Link } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration, type CelebrationKind } from '@/components/Celebration';
import { CritterScene, type Beam } from '@/components/CritterScene';
import { HabitCard, type GoalStyle } from '@/components/HabitCard';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { DateKey } from '@/rules/dates';
import { getRank } from '@/rules/rank';
import {
  getDailyResult,
  getEnergy,
  getWeekProgress,
  isDue,
  nextCheckIn,
  STARS,
  type CheckIn,
} from '@/rules/scoring';
import { getSkyLevel, isDaytime } from '@/rules/sky';
import { font, MIN_TAP_SIZE, radius, space, WIDE_LAYOUT_MIN_WIDTH } from '@/theme';
import { tuning } from '@/config/tuning';
import { THEME_LABELS, THEME_PREFERENCES } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';

export default function HomeScreen() {
  const styles = useStyles();
  const { state, dispatch, today } = useTracker();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN_WIDTH;

  const result = getDailyResult(state.habits, state.log, today);
  const skyLevel = getSkyLevel(result);
  const todayLog = state.log[today] ?? {};

  const [beam, setBeam] = useState<Beam | null>(null);
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
    setBeam((prev) => ({ id: (prev?.id ?? 0) + 1, stars: value ? STARS[value] : 0 }));
    dispatch(
      viaTap
        ? { type: 'tapHabit', date: today, habitId }
        : { type: 'setCheckIn', date: today, habitId, checkIn: value },
    );
  };

  const scene = (
    <CritterScene
      skyLevel={skyLevel}
      isDay={isDaytime(new Date().getHours())}
      energy={getEnergy(result)}
      checkedInCount={result.checkedInCount}
      dueCount={result.dueCount}
      glow={result.score ?? 0}
      beam={beam}
    />
  );

  const habits = (
    <View style={styles.cards}>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, isWide && styles.pageWide]}>
          <Header today={today} />
          {isWide ? (
            <View style={styles.wideRow}>
              <View style={styles.wideColumn}>{habits}</View>
              <View style={styles.wideColumn}>{scene}</View>
            </View>
          ) : (
            <>
              {scene}
              {habits}
            </>
          )}
          <TestTools
            goalStyle={goalStyle}
            onGoalStyle={setGoalStyle}
            onNextDay={() => dispatch({ type: 'nextDay' })}
            onReset={() => {
              lastCelebrated.current = null;
              dispatch({ type: 'reset' });
            }}
          />
        </View>
      </ScrollView>
      {celebration ? <Celebration kind={celebration} onClose={() => setCelebration(null)} /> : null}
    </SafeAreaView>
  );
}

function Header({ today }: { today: DateKey }) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text style={styles.date} testID="today-date" accessibilityRole="header">
        {formatDate(today)}
      </Text>
      <Link href="/habits" asChild>
        <Pressable
          style={styles.modeButton}
          testID="habits-link"
          accessibilityRole="button"
          accessibilityLabel="Habits"
        >
          <Text style={styles.modeText}>Habits ›</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function TestTools({
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

function formatDate(key: DateKey): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.surfaceSheet },
    scroll: { flexGrow: 1, alignItems: 'center', paddingVertical: space.lg },
    page: { width: '100%', maxWidth: 560, paddingHorizontal: space.lg, gap: space.lg },
    pageWide: { maxWidth: 1100 },
    wideRow: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
    wideColumn: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
    },
    date: { fontSize: font.title, fontWeight: '800', color: c.onSurface, flexShrink: 1 },
    modeButton: {
      minHeight: MIN_TAP_SIZE,
      justifyContent: 'center',
      paddingHorizontal: space.md,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeText: { fontSize: font.small, fontWeight: '700', color: c.onSurface },
    cards: { gap: space.md },
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
