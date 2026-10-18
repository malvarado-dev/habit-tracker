// Main screen: the critter on top (Finch-style) and habit cards below. On wide screens,
// habits move to the left and the critter to the right, like v0.

import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Celebration, type CelebrationKind } from '@/components/Celebration';
import { CritterScene, type Beam } from '@/components/CritterScene';
import { HabitCard } from '@/components/HabitCard';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { DateKey } from '@/rules/dates';
import { getRank } from '@/rules/rank';
import {
  getDailyResult,
  getEnergy,
  isTargetMetEarlier,
  nextCheckIn,
  STARS,
  type CheckIn,
} from '@/rules/scoring';
import { getSkyLevel, isDaytime } from '@/rules/sky';
import {
  cardColors,
  colors,
  font,
  MIN_TAP_SIZE,
  radius,
  space,
  WIDE_LAYOUT_MIN_WIDTH,
} from '@/theme';

/** The rank celebration waits this long after the last check-in (PRD-03, PRD-05). */
const CELEBRATION_DELAY_MS = 2000;

export default function HomeScreen() {
  const { state, dispatch, today } = useTracker();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_MIN_WIDTH;

  const result = getDailyResult(state.habits, state.log, today);
  const skyLevel = getSkyLevel(result, state.mode);
  const todayLog = state.log[today] ?? {};
  const active = state.habits.filter((h) => !isTargetMetEarlier(h, state.log, today));
  const doneForWeek = state.habits.filter((h) => isTargetMetEarlier(h, state.log, today));

  const [beam, setBeam] = useState<Beam | null>(null);
  const [celebration, setCelebration] = useState<CelebrationKind | null>(null);

  const dayKey = !result.isComplete
    ? null
    : result.isRestDay
      ? `${today}-rest`
      : `${today}-${result.score === null ? 'none' : getRank(result.score, state.mode)}`;

  // Don't replay a celebration for a day that was already finished when the app opened.
  const lastCelebrated = useRef<string | null>(dayKey);

  useEffect(() => {
    if (!dayKey || dayKey === lastCelebrated.current) return;
    const timer = setTimeout(() => {
      lastCelebrated.current = dayKey;
      setCelebration(
        result.isRestDay || result.score === null
          ? { type: 'rest' }
          : { type: 'rank', rank: getRank(result.score, state.mode) },
      );
    }, CELEBRATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dayKey, result.isRestDay, result.score, state.mode]);

  const checkIn = (habitId: string, value: CheckIn, viaTap: boolean) => {
    if (!state.hatched) setCelebration({ type: 'hatch' });
    setBeam((prev) => ({ id: (prev?.id ?? 0) + 1, stars: STARS[value] }));
    dispatch(
      viaTap
        ? { type: 'tapHabit', date: today, habitId }
        : { type: 'setCheckIn', date: today, habitId, checkIn: value },
    );
  };

  const scene = (
    <CritterScene
      hatched={state.hatched}
      skyLevel={skyLevel}
      isDay={isDaytime(new Date().getHours())}
      energy={getEnergy(result)}
      checkedInCount={result.checkedInCount}
      activeCount={result.activeCount}
      glow={result.score ?? 0}
      beam={beam}
    />
  );

  const habits = (
    <View style={styles.cards}>
      {active.map((habit) => {
        const current = todayLog[habit.id];
        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            checkIn={current}
            color={cardColors[state.habits.indexOf(habit) % cardColors.length] ?? cardColors[0]}
            onTap={() => checkIn(habit.id, nextCheckIn(current), true)}
            onSwipe={(value) => checkIn(habit.id, value, false)}
          />
        );
      })}
      {doneForWeek.length > 0 ? (
        <Text style={styles.doneForWeek} testID="done-for-week">
          Done for the week: {doneForWeek.map((h) => h.name).join(', ')} ✓
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.page, isWide && styles.pageWide]}>
          <Header today={today} mode={state.mode} />
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
            onNextDay={() => dispatch({ type: 'nextDay', today })}
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

function Header({ today, mode }: { today: DateKey; mode: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.date} testID="today-date" accessibilityRole="header">
        {formatDate(today)}
      </Text>
      <Link href="/habits" asChild>
        <Pressable
          style={styles.modeButton}
          testID="mode-label"
          accessibilityRole="button"
          accessibilityLabel={`${mode} mode. Opens Habits and Mode.`}
        >
          <Text style={styles.modeText}>{mode} mode ›</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function TestTools({ onNextDay, onReset }: { onNextDay: () => void; onReset: () => void }) {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  date: { fontSize: font.title, fontWeight: '800', color: colors.text, flexShrink: 1 },
  modeButton: {
    minHeight: MIN_TAP_SIZE,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeText: { fontSize: font.small, fontWeight: '700', color: colors.accent },
  cards: { gap: space.md },
  doneForWeek: { color: colors.textMuted, fontSize: font.small, textAlign: 'center' },
  testTools: {
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: space.sm,
  },
  testTitle: { fontSize: font.small, color: colors.textMuted, fontWeight: '700' },
  testRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  testButton: {
    minHeight: MIN_TAP_SIZE,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testButtonText: { color: colors.text, fontWeight: '700' },
  testButtonDanger: { borderColor: colors.danger },
  testButtonDangerText: { color: colors.danger },
});
