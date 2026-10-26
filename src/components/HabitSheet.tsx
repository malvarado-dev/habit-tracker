// The habit sheet's contents, shared by the phone and wide layouts (T10): the Activity Bar on top,
// then the Main Quest card and the habit cards, which scroll inside. The room and pet are never
// inside it, so they stay still while the cards scroll. Every log shows the Undo bar (P2-08a).

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityBar } from '@/components/ActivityBar';
import { HabitCard } from '@/components/HabitCard';
import { MainQuestCard } from '@/components/MainQuestCard';
import { UndoBar } from '@/components/UndoBar';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getActivityBar } from '@/rules/activityBar';
import { logCount, type Habit } from '@/rules/habits';
import { allHabits } from '@/rules/locking';
import { groupHabits } from '@/rules/sheet';
import { space } from '@/theme';

// Main Quest stand-in until P2-15 (#86) gives the sheet the real quest.
const QUEST_PLACEHOLDER = { name: 'Heal Neko', done: 0, total: 7, unit: 'days' } as const;

// Bad habits arrive in P2-09 (#80). The section only shows once there is at least one.
const NO_BAD_HABITS: string[] = [];

export function HabitSheet({ bottomPadding }: { bottomPadding: number }) {
  const { state, dispatch, today } = useTracker();
  const { colors: c } = useTheme();
  const bar = getActivityBar(allHabits(state), state.log, today, state.targets[today]);
  const sections = groupHabits(state.habits, state.log, today);
  const badHabits = NO_BAD_HABITS;
  // The last log, so Undo can take it back. `id` changes every log to restart the timer.
  const [undo, setUndo] = useState<{ habit: Habit; id: number } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), tuning.habits.undoMs);
    return () => clearTimeout(timer);
  }, [undo]);

  const log = (habit: Habit) => {
    dispatch({ type: 'logHabit', date: today, habitId: habit.id });
    setUndo((u) => ({ habit, id: (u?.id ?? 0) + 1 }));
  };

  const undoLog = () => {
    if (!undo) return;
    dispatch({ type: 'undoLog', date: today, habitId: undo.habit.id });
    setUndo(null);
  };

  const card = (habit: Habit) => (
    <HabitCard
      key={habit.id}
      habit={habit}
      count={logCount(state.log, today, habit.id)}
      onLog={() => log(habit)}
    />
  );

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
      <ActivityBar
        fill={bar.fill}
        logs={bar.logs}
        target={bar.target}
        isRestDay={bar.isRestDay}
        activityIcons
      />
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
      {undo ? (
        <UndoBar
          key={undo.id}
          text={`${undo.habit.name || 'Habit'} logged`}
          undoLabel={`Undo, take back the last ${undo.habit.name || 'habit'} log`}
          onUndo={undoLog}
        />
      ) : null}
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
