// Edit a saved bad habit. Valid edits save immediately; Remove returns to Manage habits.
import { router, useLocalSearchParams } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadHabitForm, useBadHabitStyles } from '@/components/BadHabitForm';
import { BackLink } from '@/components/HabitForm';
import { pageTitle } from '@/components/pageTitle';
import { nameHint } from '@/features/habits/habitName';
import { setRemoved } from '@/features/habits/undoRemove';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useManageTracker } from '@/features/tracker/TrackerProvider';

export function generateMetadata(): Metadata {
  return { title: pageTitle('bad-habit/[id]') };
}

export default function EditBadHabitScreen() {
  const styles = useBadHabitStyles();
  const { state, dispatch, mode } = useManageTracker();
  const { badHabitDesign } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const index = state.badHabits.findIndex((b) => b.id === id);
  const habit = state.badHabits[index];
  const [name, setName] = useState(habit?.name ?? '');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/habits'));
  const back = <BackLink label="Manage habits" onPress={goBack} testID="edit-bad-back" />;

  if (!habit) {
    return (
      <SafeAreaView style={styles.screen} testID="edit-bad-missing">
        <View style={styles.content}>
          {back}
          <Text style={styles.body}>This habit is gone.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pair = state.habits.some((h) => h.id === habit.pairedWith) ? habit.pairedWith : undefined;
  return (
    <SafeAreaView style={styles.screen} testID="edit-bad-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {back}
        <Text style={styles.title} accessibilityRole="header">
          Edit bad habit
        </Text>
        <BadHabitForm
          idPrefix="edit-bad"
          name={name}
          onNameChange={(value) => {
            setName(value);
            dispatch({ type: 'renameBadHabit', badHabitId: habit.id, name: value });
          }}
          hint={nameHint(name, [...state.habits, ...state.badHabits], habit.id)}
          pair={pair}
          onPairChange={(pairedWith) =>
            dispatch({ type: 'pairBadHabit', badHabitId: habit.id, pairedWith })
          }
          habits={state.habits}
          canPair={badHabitDesign === 'design1'}
        />
        <View style={styles.spacer} />
        <Pressable
          onPress={() => {
            setRemoved({ kind: 'bad', habit, index, mode });
            dispatch({ type: 'removeBadHabit', badHabitId: habit.id });
            goBack();
          }}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          testID="edit-bad-remove"
          accessibilityRole="button"
          accessibilityLabel={`Remove bad habit ${habit.name}`}
        >
          <Text style={styles.removeText}>Remove bad habit</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
