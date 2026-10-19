// Day screen (SPEC-00, T16; canvas board 5), opened from History. Since T23 it looks like Today:
// the Background and critter with the live sky, and the habit sheet holding a short lock line
// ("Habits lock in 38hrs"), the Energy bar labeled with the date (T24), and the same habit cards; tap and swipe work the same. The sky and critter
// show that day's rank (the saved one once locked); a day with no check-in shows the critter
// asleep. Scoring plays the same rank celebration as Today: never on open, and a replay only if the
// rank goes up. Today and the 2 days before can change; older days are locked: cards dimmed,
// taps and swipes off. Future days can't be opened. On wide, History sits under the Background
// card as on Today, and tapping a day there switches to it.

import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard } from '@/components/HabitCard';
import { SceneLayout } from '@/components/SceneLayout';
import { useCritterAndMoment } from '@/components/useCritterAndMoment';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { background as sky, todayLayout, type ThemeColors } from '@/design/tokens';
import { canOpenDay, dayBarLabel, dayStatusText } from '@/features/history/historyModel';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { DateKey } from '@/rules/dates';
import { allHabits, historyDay } from '@/rules/locking';
import { cardNeed, getEnergyBar } from '@/rules/energy';
import {
  existsOn,
  getDailyResult,
  getWeekProgress,
  nextCheckIn,
  type CheckIn,
} from '@/rules/scoring';
import { getSkyTime, sceneLevel, type SkyTime } from '@/rules/sky';
import { MIN_TAP_SIZE, space } from '@/theme';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const BACK = {
  history: { label: 'History', path: '/history' },
  today: { label: 'Today', path: '/' },
} as const;

type Back = (typeof BACK)[keyof typeof BACK];

export default function DayScreen() {
  const styles = useStyles();
  const { today, openDays, oldestDay } = useTracker();
  const params = useLocalSearchParams<{ date?: string; from?: string }>();
  const back = BACK[params.from === 'today' ? 'today' : 'history'];
  const date = typeof params.date === 'string' && DATE_KEY.test(params.date) ? params.date : null;

  if (!date || !canOpenDay(date, today, oldestDay)) {
    return (
      <SafeAreaView style={styles.screen} testID="day-screen">
        <View style={styles.content}>
          <BackButton back={back} onPage />
          <Text style={styles.status} testID="day-unavailable">
            {date && date > today
              ? "This day hasn't happened yet."
              : `Test mode only goes back ${openDays} days.`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <DayScene date={date} back={back} />;
}

function DayScene({ date, back }: { date: DateKey; back: Back }) {
  const styles = useStyles();
  const { state, dispatch, today, openDays } = useTracker();
  const { goalStyle } = useSettings();
  const focused = useIsFocused();

  const now = useMinuteClock();
  const status = dayStatusText(date, today, state.lockedThrough, openDays, now);
  const dayLog = state.log[date] ?? {};
  // Same bar math as Today (T18). The bar is live; the sky uses the saved rank once locked.
  const bar = getEnergyBar(allHabits(state), state.log, date);

  // Same sky, critter, and celebration rules as Today, for this day (T23).
  const skyLevel = sceneLevel(historyDay(state, date));
  const skyTime = getSkyTime(new Date().getHours());
  const reactKey = JSON.stringify(dayLog);
  const live = getDailyResult(allHabits(state), state.log, date);
  const { woken, wake, moment } = useCritterAndMoment(live, date, reactKey, focused);

  const checkIn = (habitId: string, value: CheckIn | undefined, viaTap: boolean) => {
    if (status.locked) return;
    dispatch(
      viaTap
        ? { type: 'tapHabit', date, habitId }
        : { type: 'setCheckIn', date, habitId, checkIn: value },
    );
  };

  return (
    <SceneLayout
      testID="day-screen"
      critter={{ level: skyLevel, woken, onWake: wake, time: skyTime, reactKey, moment }}
      corner={(onPage) => <BackButton back={back} time={skyTime} onPage={onPage} />}
      // Wide History: pick another day in place, keeping where Back goes.
      onOpenDay={(next) => router.setParams({ date: next })}
      sheet={(bottomPadding) => (
        <>
          {/* One short line on top (T24): "Habits lock in 38hrs" or "Habits locked in". */}
          <Text style={styles.status} testID="day-status">
            {status.text}
          </Text>

          {/* The date lives on the bar now: "Today" or "Thu, Oct 15" (T24). */}
          <EnergyBar fill={bar.fill} isRestDay={bar.isRestDay} label={dayBarLabel(date, today)} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.cards, { paddingBottom: bottomPadding }]}
            testID="day-habit-list"
          >
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
          </ScrollView>
        </>
      )}
    />
  );
}

/** The clock, refreshed each minute so the lock countdown stays current. */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tuning.day.clockRefreshMs);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Back, top left. On the sky it uses the same see-through look and ink as the menu button. */
function BackButton({
  back,
  time = 'day',
  onPage,
}: {
  back: Back;
  time?: SkyTime;
  onPage: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const skyInk = time === 'day' ? sky.onSkyDay : sky.onSkyDark;
  const ink = onPage ? colors.onSurface : skyInk;
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(back.path);
  };
  return (
    <Pressable
      onPress={goBack}
      style={[
        styles.back,
        !onPage && [styles.backOnSky, { backgroundColor: withAlpha(skyInk, 0.12) }],
      ]}
      testID="day-back"
      accessibilityRole="button"
      accessibilityLabel={`Back to ${back.label}`}
    >
      <Text style={[styles.backText, { color: ink }]}>‹ {back.label}</Text>
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
      width: '100%',
      maxWidth: todayLayout.sheetMaxWidth,
      alignSelf: 'center',
      padding: space.lg,
      gap: space.md,
    },
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backOnSky: { paddingHorizontal: space.md, borderRadius: MIN_TAP_SIZE / 2 },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    status: { ...textStyle('label'), color: c.onSurfaceMuted },
    scroll: { flex: 1 },
    cards: { gap: space.md },
  });
