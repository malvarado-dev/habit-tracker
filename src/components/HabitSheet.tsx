// The habit sheet's contents, shared by the phone and wide layouts (T10): the Energy bar on top,
// then the habit cards and the test tools, which scroll inside. The Background and critter are
// never inside it, so they stay still while the cards scroll.

import { ScrollView, StyleSheet } from 'react-native';

import { EnergyBar } from '@/components/EnergyBar';
import { HabitCard, type GoalStyle } from '@/components/HabitCard';
import { TestTools } from '@/components/TestTools';
import { useTracker } from '@/features/tracker/TrackerProvider';
import {
  getDailyResult,
  getEnergy,
  getWeekProgress,
  isDue,
  nextCheckIn,
  type CheckIn,
} from '@/rules/scoring';
import { space } from '@/theme';

export function HabitSheet({
  goalStyle,
  onGoalStyle,
  bottomPadding,
}: {
  goalStyle: GoalStyle;
  onGoalStyle: (style: GoalStyle) => void;
  bottomPadding: number;
}) {
  const { state, dispatch, today } = useTracker();
  const result = getDailyResult(state.habits, state.log, today);
  const todayLog = state.log[today] ?? {};

  const checkIn = (habitId: string, value: CheckIn | undefined, viaTap: boolean) => {
    dispatch(
      viaTap
        ? { type: 'tapHabit', date: today, habitId }
        : { type: 'setCheckIn', date: today, habitId, checkIn: value },
    );
  };

  return (
    <>
      <EnergyBar
        energy={getEnergy(result)}
        earnedStars={result.earnedStars}
        possibleStars={result.possibleStars}
        isRestDay={result.isRestDay}
      />
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
          onGoalStyle={onGoalStyle}
          onNextDay={() => dispatch({ type: 'nextDay' })}
          onReset={() => dispatch({ type: 'reset' })}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  cards: { gap: space.md, paddingTop: space.xs },
});
