// Day screen (SPEC-00, T16; canvas board 5), opened from History. The date, that day's face,
// the Energy bar, and the same habit cards as Today; tap and swipe work the same. Today and the
// 2 days before can change. Older days are locked: cards dimmed, taps and swipes off. No
// Background, sky, critter wake-up, or rank celebration here. Future days can't be opened.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard } from '@/components/HabitCard';
import { CritterFace } from '@/components/history/CritterFace';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { history as size, todayLayout, type ThemeColors } from '@/design/tokens';
import { canOpenDay, dayStatusText, shortDate } from '@/features/history/historyModel';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { allHabits, historyDay } from '@/rules/locking';
import { cardNeed, getEnergyBar } from '@/rules/energy';
import { existsOn, getWeekProgress, nextCheckIn, type CheckIn } from '@/rules/scoring';
import { MIN_TAP_SIZE, space } from '@/theme';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const BACK = {
  history: { label: 'History', path: '/history' },
  today: { label: 'Today', path: '/' },
} as const;

export default function DayScreen() {
  const styles = useStyles();
  const { state, dispatch, today, openDays, oldestDay } = useTracker();
  const { goalStyle } = useSettings();
  const params = useLocalSearchParams<{ date?: string; from?: string }>();
  const back = BACK[params.from === 'today' ? 'today' : 'history'];
  const date = typeof params.date === 'string' && DATE_KEY.test(params.date) ? params.date : null;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(back.path);
  };

  const backButton = (
    <Pressable
      onPress={goBack}
      style={styles.back}
      testID="day-back"
      accessibilityRole="button"
      accessibilityLabel={`Back to ${back.label}`}
    >
      <Text style={styles.backText}>‹ {back.label}</Text>
    </Pressable>
  );

  if (!date || !canOpenDay(date, today, oldestDay)) {
    return (
      <SafeAreaView style={styles.screen} testID="day-screen">
        <View style={styles.content}>
          {backButton}
          <Text style={styles.status} testID="day-unavailable">
            {date && date > today
              ? "This day hasn't happened yet."
              : `Test mode only goes back ${openDays} days.`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = dayStatusText(date, today, state.lockedThrough, openDays);
  const result = historyDay(state, date);
  const dayLog = state.log[date] ?? {};
  // Same bar math as Today (T18). Locked days keep their saved rank face; the bar is live.
  const bar = getEnergyBar(allHabits(state), state.log, date);

  const checkIn = (habitId: string, value: CheckIn | undefined, viaTap: boolean) => {
    if (status.locked) return;
    dispatch(
      viaTap
        ? { type: 'tapHabit', date, habitId }
        : { type: 'setCheckIn', date, habitId, checkIn: value },
    );
  };

  return (
    <SafeAreaView style={styles.screen} testID="day-screen">
      <ScrollView contentContainerStyle={styles.content}>
        {backButton}
        <View style={styles.heading}>
          <View style={styles.faceSlot}>
            {result.outcome === 'rank' && result.rank ? (
              <CritterFace rank={result.rank} width={size.dayFaceWidth} testID="day-face" />
            ) : result.outcome === 'rest' ? (
              <Text style={styles.rest}>Rest</Text>
            ) : null}
          </View>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header" testID="day-title">
              {shortDate(date)}
            </Text>
            <Text style={styles.status} testID="day-status">
              {status.text}
            </Text>
          </View>
        </View>

        <EnergyBar fill={bar.fill} isRestDay={bar.isRestDay} />

        <View style={styles.cards} testID="day-habit-list">
          {/* Only habits active that day, including ones removed since (#52, T21). */}
          {allHabits(state)
            .filter((h) => existsOn(h, date))
            .map((habit) => {
              const current = dayLog[habit.id];
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  checkIn={current}
                  need={status.locked ? 'none' : cardNeed(habit, state.log, date)}
                  progress={getWeekProgress(habit, state.log, date)}
                  goalStyle={goalStyle}
                  locked={status.locked}
                  onTap={() => checkIn(habit.id, nextCheckIn(current), true)}
                  onSwipe={(value) => checkIn(habit.id, value, false)}
                />
              );
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
      width: '100%',
      maxWidth: todayLayout.sheetMaxWidth,
      alignSelf: 'center',
      padding: space.lg,
      gap: space.md,
    },
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    heading: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    faceSlot: { minWidth: size.dayFaceWidth, alignItems: 'center' },
    headingText: { flex: 1, gap: 2 },
    title: { ...textStyle('display'), color: c.onSurface },
    status: { ...textStyle('label'), color: c.onSurfaceMuted },
    rest: { ...textStyle('label'), color: c.onSurfaceMuted },
    cards: { gap: space.md },
  });
