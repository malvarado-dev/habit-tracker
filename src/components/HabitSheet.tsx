// The habit sheet's contents, shared by the phone and wide layouts (T10): the Activity Bar on top,
// then the Main Quest card and the habit cards, which scroll inside. The room and pet are never
// inside it, so they stay still while the cards scroll. Every log shows the Undo bar (P2-08a).

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityBar } from '@/components/ActivityBar';
import { BadHabitsTray } from '@/components/BadHabitsTray';
import { HabitCard } from '@/components/HabitCard';
import { MainQuestCard } from '@/components/MainQuestCard';
import { QuestSheet } from '@/components/QuestSheet';
import { UndoBar } from '@/components/UndoBar';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getActivityBar } from '@/rules/activityBar';
import { slipCount, trayHabits, type BadHabit } from '@/rules/badHabits';
import { type Habit } from '@/rules/habits';
import { dayLogs, linkedBadHabit } from '@/rules/linked';
import { allHabits, barLog } from '@/rules/locking';
import { finishedCount } from '@/rules/payoff';
import { healCheckIns, healStatus } from '@/rules/quest';
import { requestPetMoment } from '@/scene/petMoments';
import { groupHabits } from '@/rules/sheet';
import { space } from '@/theme';

// Main Quest stand-in until P2-15 (#86) gives the sheet the real quest.

export function HabitSheet({ bottomPadding }: { bottomPadding: number }) {
  const { state, dispatch, today } = useTracker();
  // Heal quest (P2-15): the card's state, the sheet, and Claim.
  const quest = healStatus(state, today);
  const questDone = healCheckIns(state, today);
  const [questOpen, setQuestOpen] = useState(false);
  const claimQuest = () => {
    dispatch({ type: 'claimQuest', date: today });
    requestPetMoment({ kind: 'celebrate', caption: 'Neko is all healed.' });
  };
  const { colors: c } = useTheme();
  const { badHabitDesign } = useSettings();
  const log = barLog(state);
  const bar = getActivityBar(allHabits(state), log, today, state.targets[today]);
  const sections = groupHabits(state.habits, log, today, state.skips);
  // Design 2 has no pairing (PRD-15), so its cards slide to Skip only.
  const linkedOf = (habit: Habit) =>
    badHabitDesign === 'design1' ? linkedBadHabit(habit, state.badHabits) : undefined;
  const tray = trayHabits(state.badHabits, state.habits, badHabitDesign);
  // The last change, so Undo can take it back. `id` changes every time to restart the timer.
  // A slip remembers the count before it, so Undo after a stepper change puts it back exactly.
  const [undo, setUndo] = useState<
    | { kind: 'log'; habit: Habit; id: number }
    | { kind: 'skip'; habit: Habit; id: number }
    | { kind: 'slip'; bad: BadHabit; before: number; after: number; id: number }
    | null
  >(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), tuning.habits.undoMs);
    return () => clearTimeout(timer);
  }, [undo]);

  const logHabit = (habit: Habit) => {
    dispatch({ type: 'logHabit', date: today, habitId: habit.id });
    setUndo((u) => ({ kind: 'log', habit, id: (u?.id ?? 0) + 1 }));
  };

  const skip = (habit: Habit) => {
    dispatch({ type: 'skipHabit', date: today, habitId: habit.id });
    setUndo((u) => ({ kind: 'skip', habit, id: (u?.id ?? 0) + 1 }));
  };

  const slips = (id: string) => slipCount(state.slips, today, id);

  const setSlips = (bad: BadHabit, count: number) => {
    const before = slips(bad.id);
    if (count < 0 || count === before) return;
    dispatch({ type: 'setSlips', date: today, badHabitId: bad.id, count });
    setUndo((u) => ({ kind: 'slip', bad, before, after: count, id: (u?.id ?? 0) + 1 }));
  };

  const undoLast = () => {
    if (!undo) return;
    if (undo.kind === 'log') dispatch({ type: 'undoLog', date: today, habitId: undo.habit.id });
    else if (undo.kind === 'skip')
      dispatch({ type: 'unskipHabit', date: today, habitId: undo.habit.id });
    else dispatch({ type: 'setSlips', date: today, badHabitId: undo.bad.id, count: undo.before });
    setUndo(null);
  };

  const card = (habit: Habit) => {
    const { gold, slate } = dayLogs(habit, state.log, state.slips, state.badHabits, today);
    const linked = linkedOf(habit);
    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        count={gold}
        slate={linked ? slate : 0}
        linked={linked ? { name: linked.name, count: slips(linked.id) } : undefined}
        onLog={() => logHabit(habit)}
        onSkip={() => skip(habit)}
        onSlip={linked ? () => setSlips(linked, slips(linked.id) + 1) : undefined}
        onEdit={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
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
      <ActivityBar
        fill={bar.fill}
        logs={bar.logs}
        target={bar.target}
        isRestDay={bar.isRestDay}
        activityIcons
        finished={finishedCount(allHabits(state), log, today)}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        testID="habit-list"
      >
        {quest !== 'claimed' ? (
          <MainQuestCard
            name="Heal Neko"
            status={quest}
            done={questDone}
            total={tuning.quest.heal.goal}
            unit="days"
            onOpen={() => setQuestOpen(true)}
            onClaim={claimQuest}
          />
        ) : null}
        {section('today', 'Today', sections.today)}
        {section('anytime', 'Anytime', sections.anytime)}
        <BadHabitsTray
          badHabits={tray}
          countOf={slips}
          onSlip={(bad) => setSlips(bad, slips(bad.id) + 1)}
          onSetCount={setSlips}
        />
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
          text={undoText(undo)}
          undoLabel={
            undo.kind === 'log'
              ? `Undo, take back the last ${undo.habit.name || 'habit'} log`
              : undo.kind === 'skip'
                ? `Undo, bring back ${undo.habit.name || 'the habit'}`
                : `Undo, put ${undo.bad.name || 'the bad habit'} back to ${undo.before}`
          }
          onUndo={undoLast}
        />
      ) : null}
      <QuestSheet
        open={questOpen}
        accepted={quest !== 'new'}
        done={questDone}
        onAccept={() => {
          dispatch({ type: 'acceptQuest', date: today });
          setQuestOpen(false);
        }}
        onClose={() => setQuestOpen(false)}
      />
    </>
  );
}

/** What the Undo bar says: "Sleep logged", "Sleep skipped today", "Soda counted", or "Soda set to 0". */
function undoText(
  undo:
    | { kind: 'log' | 'skip'; habit: Habit }
    | { kind: 'slip'; bad: BadHabit; before: number; after: number },
): string {
  if (undo.kind !== 'slip') {
    return `${undo.habit.name || 'Habit'} ${undo.kind === 'log' ? 'logged' : 'skipped today'}`;
  }
  const name = undo.bad.name || 'Bad habit';
  return undo.after === undo.before + 1 ? `${name} counted` : `${name} set to ${undo.after}`;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: space.lg, paddingTop: space.xs },
  section: { gap: space.md },
  historyLink: {
    alignSelf: 'center',
    paddingVertical: space.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  historyText: { textDecorationLine: 'underline' },
});
