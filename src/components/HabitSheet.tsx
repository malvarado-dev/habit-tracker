// The habit list, shared by phone and wide layouts. Undo appears when a card leaves the list.
//
// Wide: a sheet with the Activity Bar on top, then the Main Quest card and the habit cards, which
// scroll inside.
//
// Phone and tablet portrait (#133): no sheet. The room fills the screen and everything floats over
// it. The Main Quest is a small pill next to the Menu button. The Today pill and the Activity Bar
// (no notch icons) share a row above the cards; once the list scrolls up to it, that row sticks
// under the top bar on a strip, and the cards slide under it.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

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
import { logCount, type Habit } from '@/rules/habits';
import { dayLogs, linkedBadHabit } from '@/rules/linked';
import { allHabits, barLog } from '@/rules/locking';
import { canExplore } from '@/rules/explore';
import { finishedCount } from '@/rules/payoff';
import { healCheckIns, healStatus } from '@/rules/quest';
import { announce, requestPetMoment } from '@/scene/petMoments';

import { groupHabits, isFinishedToday } from '@/rules/sheet';
import { radius, space } from '@/theme';
import { todayLayout } from '@/design/tokens';

/** Narrator line once the pet heads out (P2-16). Placeholder words. */
const EXPLORE_LINE = 'Neko is off to explore. Check back tomorrow to see what Neko finds.';

// Main Quest stand-in until P2-15 (#86) gives the sheet the real quest.

/**
 * The floating list scrolls with the gesture handler's ScrollView (#135), so it works with the
 * cards' slide gesture instead of fighting it, which made scrolling stick.
 */
const FloatingScroll = Animated.createAnimatedComponent(GestureScrollView);

/** Where the floating list sits on a phone or tablet in portrait (#133), from SceneLayout. */
export type FloatingLayout = {
  /** The Today row at rest, clear of the pet and the bed. */
  listTop: number;
  /** The Today row once it sticks under the top bar. */
  stuckTop: number;
  /** Top bar: its top, and where the quest pill starts (right of the Menu button). */
  topBarTop: number;
  questLeft: number;
  /** Side margins, including the safe area. */
  left: number;
  right: number;
  /** Screen height, so even a short list can scroll far enough for the Today row to stick. */
  screenHeight: number;
};

export function HabitSheet({
  bottomPadding,
  floating,
}: {
  bottomPadding: number;
  floating?: FloatingLayout;
}) {
  const { state, dispatch, today } = useTracker();
  // Floating list (#133): the Today row follows the list up, then sticks; the strip fades in.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const restTop = floating?.listTop ?? 0;
  const stuckTop = floating?.stuckTop ?? 0;
  const travel = Math.max(0, restTop - stuckTop);
  const fade = tuning.scene.stripFadeDistance;
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(stuckTop, restTop - scrollY.value) }],
  }));
  const stripStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [travel - fade, travel], [0, 1], Extrapolation.CLAMP),
  }));
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
  const trayList = trayHabits(state.badHabits, state.habits, badHabitDesign);
  // Remember the action that removed a card. Count-only edits leave this Undo untouched.
  // A completing linked slip remembers its prior count so Undo brings the card back.
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
    if (isFinishedToday(habit, logCount(log, today, habit.id) + 1)) {
      setUndo((u) => ({ kind: 'log', habit, id: (u?.id ?? 0) + 1 }));
    }
  };

  const skip = (habit: Habit) => {
    dispatch({ type: 'skipHabit', date: today, habitId: habit.id });
    setUndo((u) => ({ kind: 'skip', habit, id: (u?.id ?? 0) + 1 }));
  };

  const slips = (id: string) => slipCount(state.slips, today, id);

  const setSlips = (bad: BadHabit, count: number, habit?: Habit) => {
    const before = slips(bad.id);
    if (count < 0 || count === before) return;
    dispatch({ type: 'setSlips', date: today, badHabitId: bad.id, count });
    if (habit && isFinishedToday(habit, logCount(log, today, habit.id) + count - before)) {
      setUndo((u) => ({ kind: 'slip', bad, before, after: count, id: (u?.id ?? 0) + 1 }));
    }
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
        onSlip={linked ? () => setSlips(linked, slips(linked.id) + 1, habit) : undefined}
        onEdit={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
        floating={!!floating}
      />
    );
  };

  /** A section title: plain on the sheet, a pill when floating over the room (#133). */
  const sectionTitle = (id: string, title: string) => (
    <Text
      style={
        floating
          ? [
              textStyle('label', '700'),
              styles.pill,
              { color: c.onSurface, backgroundColor: c.surface },
            ]
          : [textStyle('label', '500'), { color: c.onSurfaceMuted }]
      }
      accessibilityRole="header"
      testID={`section-${id}-title`}
    >
      {title}
    </Text>
  );

  const section = (id: string, title: string, habits: Habit[], showTitle = true) =>
    habits.length === 0 ? null : (
      <View style={styles.section} testID={`section-${id}`}>
        {showTitle ? sectionTitle(id, title) : null}
        {habits.map(card)}
      </View>
    );

  const activityBar = (
    <ActivityBar
      fill={bar.fill}
      logs={bar.logs}
      target={bar.target}
      isRestDay={bar.isRestDay}
      petMoments
      finished={finishedCount(allHabits(state), log, today)}
    />
  );

  const exploreButton = canExplore(state.explore, today, bar.isFull) ? (
    <Pressable
      onPress={() => {
        dispatch({ type: 'sendExploring', date: today });
        announce(EXPLORE_LINE);
      }}
      style={[styles.explore, { backgroundColor: c.primary }]}
      testID="explore-button"
      accessibilityRole="button"
    >
      <Text style={[textStyle('label', '700'), { color: c.onPrimary }]}>Explore</Text>
    </Pressable>
  ) : null;

  const questCard =
    quest !== 'claimed' ? (
      <MainQuestCard
        name="Heal Neko"
        status={quest}
        done={questDone}
        total={tuning.quest.heal.goal}
        unit="days"
        onOpen={() => setQuestOpen(true)}
        onClaim={claimQuest}
        compact={!!floating}
      />
    ) : null;

  const tray = (
    <BadHabitsTray
      badHabits={trayList}
      countOf={slips}
      onSlip={(bad) => setSlips(bad, slips(bad.id) + 1)}
      onSetCount={setSlips}
      tapOpensStepper
      floating={!!floating}
    />
  );

  const historyLink = (
    <Pressable
      testID="history-link"
      accessibilityRole="link"
      accessibilityLabel="History"
      hitSlop={space.md}
      style={[styles.historyLink, floating && [styles.historyPill, { backgroundColor: c.surface }]]}
      // Opens History on today; Back returns to Today (#127).
      onPress={() => router.push({ pathname: '/history', params: { from: 'today' } })}
    >
      <Text style={[textStyle('habitName', '700'), styles.historyText, { color: c.onSurface }]}>
        History
      </Text>
    </Pressable>
  );

  const overlays = (
    <>
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

  if (floating) {
    const rowHeight = tuning.scene.todayRowHeight;
    const side = { left: floating.left, right: floating.right };
    return (
      <>
        <FloatingScroll
          style={StyleSheet.absoluteFill}
          contentContainerStyle={[
            styles.floatContent,
            side.left || side.right ? { paddingLeft: side.left, paddingRight: side.right } : null,
            {
              paddingTop: restTop + rowHeight + space.md,
              paddingBottom: bottomPadding,
              minHeight: floating.screenHeight + travel,
            },
          ]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          testID="habit-list"
        >
          <View style={styles.floatColumn}>
            {exploreButton}
            {section('today', 'Today', sections.today, false)}
            {section('anytime', 'Anytime', sections.anytime)}
            {tray}
            {historyLink}
          </View>
        </FloatingScroll>
        {/* Behind the stuck Today row and the top bar, so cards slide under them. */}
        <Animated.View
          pointerEvents="none"
          testID="today-strip"
          style={[
            styles.strip,
            { height: stuckTop + rowHeight + space.sm, backgroundColor: c.surfaceSheet },
            stripStyle,
          ]}
        />
        <Animated.View
          testID="today-row"
          // Not a button: a drag that starts on it goes to the list under it (#135).
          pointerEvents="none"
          style={[styles.todayRow, side, { height: rowHeight }, rowStyle]}
        >
          <View style={styles.todayRowInner}>
            {sectionTitle('today', 'Today')}
            <View style={styles.rowBar}>{activityBar}</View>
          </View>
        </Animated.View>
        <View
          pointerEvents="box-none"
          style={[
            styles.questSlot,
            { top: floating.topBarTop, left: floating.questLeft, right: floating.right },
          ]}
        >
          {questCard}
        </View>
        {overlays}
      </>
    );
  }

  return (
    <>
      {activityBar}
      {exploreButton}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        testID="habit-list"
      >
        {questCard}
        {section('today', 'Today', sections.today)}
        {section('anytime', 'Anytime', sections.anytime)}
        {tray}
        {historyLink}
      </ScrollView>
      {overlays}
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
  // Floating over the room (#133): pills and shadows so everything reads over the floor.
  historyPill: {
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    boxShadow: tuning.scene.floatShadow,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
    boxShadow: tuning.scene.floatShadow,
  },
  floatContent: { paddingHorizontal: space.lg, alignItems: 'center' },
  floatColumn: { width: '100%', maxWidth: todayLayout.sheetMaxWidth, gap: space.lg },
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    boxShadow: tuning.scene.floatShadow,
  },
  todayRow: { position: 'absolute', top: 0, alignItems: 'center' },
  todayRowInner: {
    flex: 1,
    width: '100%',
    maxWidth: todayLayout.sheetMaxWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowBar: { flex: 1 },
  questSlot: { position: 'absolute', alignItems: 'flex-start' },
  // explore-button in design-system.md: primary fill, full rounding, 52 pt tall.
  explore: {
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
});
