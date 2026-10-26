// Day screen (SPEC-00, T16; canvas board 5), opened from History and the History link. It looks
// like Today: the scene, and the habit sheet holding a short lock line ("Habits lock in 38hrs"),
// the Activity Bar labeled with the date (T24), and every habit active that day, finished or not,
// with the same cards; a tap logs one time. Today and the 2 days before can change; older days are
// locked: cards dimmed, taps off. Future days can't be opened. P2-18 (#89) rebuilds this screen
// as History's Day view with minus and plus. On wide, History sits under the scene, and tapping a
// day there switches to it.

import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityBar } from '@/components/ActivityBar';
import { HabitCard } from '@/components/HabitCard';
import { SceneLayout } from '@/components/SceneLayout';
import { useCritterWake } from '@/components/useCritterWake';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { background as sky, todayLayout, type ThemeColors } from '@/design/tokens';
import { canOpenDay, dayBarLabel, dayStatusText } from '@/features/history/historyModel';
import { useTracker } from '@/features/tracker/TrackerProvider';
import type { DateKey } from '@/rules/dates';
import { getActivityBar } from '@/rules/activityBar';
import { existsOn, type Habit } from '@/rules/habits';
import { dayLogs } from '@/rules/linked';
import { allHabits, barLog, historyDay } from '@/rules/locking';
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
  const focused = useIsFocused();

  const now = useMinuteClock();
  const status = dayStatusText(date, today, state.lockedThrough, openDays, now);
  // Same bar math as Today. The bar is live; the sky uses the saved result once locked.
  const bar = getActivityBar(allHabits(state), barLog(state), date, state.targets[date]);
  const skyLevel = sceneLevel(historyDay(state, date));
  const skyTime = getSkyTime(new Date().getHours());
  const logKey = JSON.stringify([state.log[date], state.slips[date]]);
  const { woken, wake } = useCritterWake(date, logKey, focused);

  // Gold and linked slips (slate) for each card's ring. Slide actions come to History in P2-18.
  const dayCounts = (habit: Habit, day: DateKey) => {
    const { gold, slate } = dayLogs(habit, state.log, state.slips, state.badHabits, day);
    return { count: gold, slate };
  };

  const log = (habitId: string) => {
    if (status.locked) return;
    dispatch({ type: 'logHabit', date, habitId });
  };

  return (
    <SceneLayout
      testID="day-screen"
      critter={{ level: skyLevel, woken, onWake: wake, time: skyTime }}
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
          <ActivityBar
            fill={bar.fill}
            logs={bar.logs}
            target={bar.target}
            isRestDay={bar.isRestDay}
            label={dayBarLabel(date, today)}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.cards, { paddingBottom: bottomPadding }]}
            testID="day-habit-list"
          >
            {/* Only habits active that day, including ones removed since (#52, T21). */}
            {allHabits(state)
              .filter((h) => existsOn(h, date))
              .map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  {...dayCounts(habit, date)}
                  locked={status.locked}
                  onLog={() => log(habit.id)}
                />
              ))}
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
