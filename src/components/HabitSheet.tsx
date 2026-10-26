// The habit sheet's contents, shared by the phone and wide layouts (T10): the Energy bar on top,
// "Weekly goal met" under it when a habit's goal is met (T18), then the habit cards, which scroll inside. The Background and critter are
// never inside it, so they stay still while the cards scroll.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard } from '@/components/HabitCard';
import { MainQuestCard } from '@/components/MainQuestCard';
import { WeeklyGoalMet, type GoalMetMoment } from '@/components/WeeklyGoalMet';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { claimGoalMet } from '@/features/tracker/goalMetSession';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { cardNeed, getEnergyBar, newlyScoredMetGoals } from '@/rules/energy';
import { getWeekProgress, nextCheckIn, type CheckIn, type Habit } from '@/rules/scoring';
import { groupHabits } from '@/rules/sheet';
import { space } from '@/theme';

// Main Quest stand-in until P2-15 (#86) gives the sheet the real quest.
const QUEST_PLACEHOLDER = { name: 'Heal Neko', done: 0, total: 7, unit: 'days' } as const;

// Bad habits arrive in P2-09 (#80). The section only shows once there is at least one.
const NO_BAD_HABITS: string[] = [];

export function HabitSheet({ bottomPadding }: { bottomPadding: number }) {
  const { state, dispatch, today } = useTracker();
  const { goalStyle } = useSettings();
  const { colors: c } = useTheme();
  const bar = getEnergyBar(state.habits, state.log, today);
  const todayLog = state.log[today] ?? {};
  const [goalMet, setGoalMet] = useState<GoalMetMoment>(null);
  const sections = groupHabits(state.habits, state.log, today);
  const badHabits = NO_BAD_HABITS;

  const checkIn = (habitId: string, value: CheckIn | undefined, viaTap: boolean) => {
    // Weekly goal met: the first scoring tap of a habit whose goal is met, once per session.
    const after = { ...state.log, [today]: { ...todayLog } };
    if (value === undefined) delete after[today]![habitId];
    else after[today]![habitId] = value;
    const met = newlyScoredMetGoals(state.habits, state.log, after, today).find(
      (h) => h.id === habitId && claimGoalMet(h.id, today),
    );
    if (met) setGoalMet((m) => ({ habit: met, id: (m?.id ?? 0) + 1 }));
    dispatch(
      viaTap
        ? { type: 'tapHabit', date: today, habitId }
        : { type: 'setCheckIn', date: today, habitId, checkIn: value },
    );
  };

  const card = (habit: Habit) => {
    const current = todayLog[habit.id];
    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        checkIn={current}
        need={cardNeed(habit, state.log, today)}
        progress={getWeekProgress(habit, state.log, today)}
        goalStyle={goalStyle}
        onTap={() => checkIn(habit.id, nextCheckIn(current), true)}
        onSwipe={(value) => checkIn(habit.id, value, false)}
      />
    );
  };

  const section = (id: string, title: string, habits: Habit[]) =>
    habits.length === 0 ? null : (
      <View style={styles.section} testID={`section-${id}`}>
        <Text
          style={[textStyle('label', '500'), { color: c.onSurfaceMuted }]}
          accessibilityRole="header"
          testID={`section-${id}-title`}
        >
          {title}
        </Text>
        {habits.map(card)}
      </View>
    );

  return (
    <>
      <EnergyBar
        fill={bar.fill}
        isRestDay={bar.isRestDay}
        label="Today"
        glowKey={goalMet?.id ?? 0}
        activityIcons
      />
      <WeeklyGoalMet moment={goalMet} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        testID="habit-list"
      >
        <MainQuestCard {...QUEST_PLACEHOLDER} />
        {section('today', 'Today', sections.today)}
        {section('anytime', 'Anytime', sections.anytime)}
        {badHabits.length > 0 ? (
          <View
            style={[styles.badHabits, { backgroundColor: c.habit8 + BAD_TINT_ALPHA }]}
            testID="bad-habits-section"
          >
            <Text
              style={[textStyle('label', '700'), { color: c.onSurface }]}
              accessibilityRole="header"
              testID="bad-habits-title"
            >
              Bad habits
            </Text>
          </View>
        ) : null}
        <Pressable
          testID="history-link"
          accessibilityRole="link"
          accessibilityLabel="History"
          hitSlop={space.md}
          style={styles.historyLink}
          // Opens the Day view for today until History's calendar lands (P2-18, #89).
          onPress={() =>
            router.push({ pathname: '/day/[date]', params: { date: today, from: 'today' } })
          }
        >
          <Text style={[textStyle('habitName', '700'), styles.historyText, { color: c.onSurface }]}>
            History
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

// Soft tint so the Bad habits section reads apart from good habits (P2-07, long-sheet-v3).
const BAD_TINT_ALPHA = '1F';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: space.lg, paddingTop: space.xs },
  section: { gap: space.md },
  badHabits: { borderRadius: 24, padding: space.lg, gap: space.md },
  historyLink: {
    alignSelf: 'center',
    paddingVertical: space.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  historyText: { textDecorationLine: 'underline' },
});
