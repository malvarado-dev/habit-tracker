// The habit sheet's contents, shared by the phone and wide layouts (T10): the Energy bar on top,
// "Weekly goal met" under it when a habit's goal is met (T18), then the habit cards and the test tools, which scroll inside. The Background and critter are
// never inside it, so they stay still while the cards scroll.

import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard } from '@/components/HabitCard';
import { TestTools } from '@/components/TestTools';
import { WeeklyGoalMet, type GoalMetMoment } from '@/components/WeeklyGoalMet';
import { SHOW_TEST_TOOLS } from '@/config/prototype';
import { useSettings } from '@/features/settings/SettingsProvider';
import { claimGoalMet } from '@/features/tracker/goalMetSession';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { cardNeed, getEnergyBar, newlyScoredMetGoals } from '@/rules/energy';
import { getWeekProgress, nextCheckIn, type CheckIn } from '@/rules/scoring';
import { space } from '@/theme';

export function HabitSheet({ bottomPadding }: { bottomPadding: number }) {
  const { state, dispatch, today } = useTracker();
  const { goalStyle } = useSettings();
  const bar = getEnergyBar(state.habits, state.log, today);
  const todayLog = state.log[today] ?? {};
  const [goalMet, setGoalMet] = useState<GoalMetMoment>(null);

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

  return (
    <>
      <EnergyBar
        fill={bar.fill}
        isRestDay={bar.isRestDay}
        label="Today"
        glowKey={goalMet?.id ?? 0}
      />
      <WeeklyGoalMet moment={goalMet} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.cards, { paddingBottom: bottomPadding }]}
        testID="habit-list"
      >
        {state.habits.map((habit) => {
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
        })}
        {/* Prototype only (T14); see TestTools.tsx for how to remove. */}
        {SHOW_TEST_TOOLS ? (
          <TestTools
            today={today}
            dayOffset={state.dayOffset}
            onNextDay={() => dispatch({ type: 'nextDay' })}
            onBackToToday={() => dispatch({ type: 'backToToday' })}
            onReset={() => dispatch({ type: 'reset' })}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  cards: { gap: space.md, paddingTop: space.xs },
});
