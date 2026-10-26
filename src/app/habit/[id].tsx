// Edit habit (SPEC-00, T12; Figma "Edit habit · Specific days" and "· Any days").
// Name and schedule, saved as you type. Only valid names save (never blank, never a
// duplicate, at most 20 characters); while the field is invalid a hint shows, and leaving
// keeps the last valid name. Icon and color pickers come in MVP.
// Remove goes back to Habits, which shows the Undo bar.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink, HabitForm } from '@/components/HabitForm';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { nameHint } from '@/features/habits/habitName';
import { setRemoved } from '@/features/habits/undoRemove';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { MIN_TAP_SIZE, radius, space } from '@/theme';
import type { Metadata } from 'expo-router/server';

import { pageTitle } from '@/components/pageTitle';

/** The page title on the web build (#113). */
export function generateMetadata(): Metadata {
  return { title: pageTitle('habit/[id]') };
}

export default function EditHabitScreen() {
  const styles = useStyles();
  const { state, dispatch, today } = useTracker();
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = state.habits.findIndex((h) => h.id === id);
  const habit = index >= 0 ? state.habits[index] : undefined;
  // What's in the field. The saved name only changes when this is valid.
  const [draft, setDraft] = useState(habit?.name ?? '');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/habits'));
  const back = <BackLink label="Habits" onPress={goBack} testID="edit-habit-back" />;

  if (!habit) {
    return (
      <SafeAreaView style={styles.screen} testID="edit-habit-missing">
        <View style={styles.content}>
          {back}
          <Text style={styles.body}>This habit is gone.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canRemove = state.habits.length > 1;
  const rename = (name: string) => {
    setDraft(name);
    // The reducer ignores blank, duplicate, and too-long names.
    dispatch({ type: 'renameHabit', habitId: habit.id, name });
  };

  const remove = () => {
    if (!canRemove) return;
    setRemoved({ habit, index });
    dispatch({ type: 'removeHabit', habitId: habit.id, date: today });
    goBack();
  };

  return (
    <SafeAreaView style={styles.screen} testID="edit-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {back}
        <Text style={styles.title} accessibilityRole="header">
          Edit habit
        </Text>

        <HabitForm
          idPrefix="edit"
          name={draft}
          onNameChange={rename}
          nameHint={nameHint(draft, [...state.habits, ...state.badHabits], habit.id)}
          schedule={habit.schedule}
          onScheduleChange={(schedule) =>
            dispatch({ type: 'setSchedule', habitId: habit.id, schedule })
          }
        />

        <View style={styles.spacer} />

        <Pressable
          onPress={remove}
          disabled={!canRemove}
          style={({ pressed }) => [
            styles.remove,
            !canRemove && styles.disabled,
            pressed && styles.pressed,
          ]}
          testID="edit-habit-remove"
          accessibilityRole="button"
          accessibilityLabel={`Remove ${habit.name}`}
          accessibilityState={{ disabled: !canRemove }}
        >
          <Text style={styles.removeText}>Remove habit</Text>
        </Pressable>
        {!canRemove ? (
          <Text style={styles.hint} testID="edit-habit-last">
            You need at least one habit.
          </Text>
        ) : null}
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
    body: { ...textStyle('body'), color: c.onSurface },
    hint: { ...textStyle('caption'), color: c.onSurfaceMuted },
    spacer: { flexGrow: 1, minHeight: space.xl },
    remove: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    removeText: { ...textStyle('label'), color: c.danger },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
  });
