// Add habit details (SPEC-00, T13; Figma "Add habit · Details"). Titled "Add habit" on screen.
// A premade habit opens pre-filled (name, suggested weekly goal); Create your own opens empty
// on Specific days, Every day. Nothing saves until Add habit, which stays gray until the name
// is valid. The new habit gets the least-used habit color. Icon and color pickers come in MVP.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink, HabitForm } from '@/components/HabitForm';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { nameHint, nameProblem } from '@/features/habits/habitName';
import { findPremade } from '@/features/habits/premadeHabits';
import { MAX_HABITS } from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { EVERY_DAY, type WeeklyGoal } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

export default function AddHabitDetailsScreen() {
  const styles = useStyles();
  const { state, dispatch } = useTracker();
  const params = useLocalSearchParams<{ premade?: string }>();
  const premade = findPremade(params.premade);
  const [name, setName] = useState(premade?.name ?? '');
  const [goal, setGoal] = useState<WeeklyGoal>(
    premade?.goal ?? { kind: 'specificDays', days: EVERY_DAY },
  );

  const full = state.habits.length >= MAX_HABITS;
  const canAdd = !full && nameProblem(name, state.habits) === null;
  const hint = full ? '15 habits is the most.' : nameHint(name, state.habits);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/add-habit'));

  const add = () => {
    if (!canAdd) return;
    const id = `${premade?.key ?? 'habit'}-${Date.now()}`;
    dispatch({ type: 'addHabit', id, name, goal });
    // Back past Pick a habit to Habits, where the new habit is last on the list.
    if (router.canDismiss()) router.dismiss(2);
    else router.replace('/habits');
  };

  return (
    <SafeAreaView style={styles.screen} testID="add-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackLink label="Add habit" onPress={goBack} testID="add-habit-back" />
        <Text style={styles.title} accessibilityRole="header">
          Add habit
        </Text>

        <HabitForm
          idPrefix="add"
          name={name}
          onNameChange={setName}
          nameHint={hint}
          goal={goal}
          onGoalChange={setGoal}
        />

        <View style={styles.spacer} />

        <Pressable
          onPress={add}
          disabled={!canAdd}
          style={({ pressed }) => [
            styles.button,
            !canAdd && styles.buttonOff,
            pressed && canAdd && styles.pressed,
          ]}
          testID="add-habit-confirm"
          accessibilityRole="button"
          accessibilityLabel="Add habit"
          accessibilityState={{ disabled: !canAdd }}
        >
          <Text style={[styles.buttonText, !canAdd && styles.buttonTextOff]}>Add habit</Text>
        </Pressable>
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
      flexGrow: 1,
      padding: space.lg,
      gap: space.md,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    title: { ...textStyle('display'), color: c.onSurface, marginBottom: space.sm },
    spacer: { flexGrow: 1, minHeight: space.xl },
    button: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    // Gray until the name is valid (Issue #23).
    buttonOff: { backgroundColor: c.surfaceDim },
    buttonText: { ...textStyle('label'), color: c.onPrimary },
    buttonTextOff: { color: c.onSurfaceMuted },
    pressed: { opacity: 0.7 },
  });
