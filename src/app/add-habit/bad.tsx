// Add bad habit (PRD-02, P2-09; canvas "Add Habit with Bad Habits"). A catalog bad habit opens
// pre-filled, with its catalog pairing picked when the user has that good habit; Create your own
// opens empty. Design 1 can pair it with one good habit (logged by sliding that card, P2-08b) or
// leave it standalone (counted in the Bad habits tray). Design 2 has no pairing.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink } from '@/components/HabitForm';
import { BadHabitForm, useBadHabitStyles } from '@/components/BadHabitForm';
import { nameHint, nameProblem } from '@/features/habits/habitName';
import { findPremadeBad, suggestedPair } from '@/features/habits/premadeHabits';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useManageTracker } from '@/features/tracker/TrackerProvider';
import type { Metadata } from 'expo-router/server';

import { pageTitle } from '@/components/pageTitle';

/** The page title on the web build (#113). */
export function generateMetadata(): Metadata {
  return { title: pageTitle('add-habit/bad') };
}

export default function AddBadHabitScreen() {
  const styles = useBadHabitStyles();
  const { state, dispatch, today } = useManageTracker();
  const { badHabitDesign } = useSettings();
  const params = useLocalSearchParams<{ premade?: string }>();
  const premade = findPremadeBad(params.premade);
  const [name, setName] = useState(premade?.name ?? '');
  const [pair, setPair] = useState<string | undefined>(() => suggestedPair(premade, state.habits));
  const canPair = badHabitDesign === 'design1';

  const names = [...state.habits, ...state.badHabits];
  const canAdd = nameProblem(name, names) === null;
  const hint = nameHint(name, names);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/add-habit'));

  const add = () => {
    if (!canAdd) return;
    const id = `bad-${premade?.key ?? 'habit'}-${Date.now()}`;
    dispatch({
      type: 'addBadHabit',
      id,
      name,
      date: today,
      ...(canPair && pair ? { pairedWith: pair } : {}),
    });
    // Back past Add habit to Habits, as adding a good habit does.
    if (router.canDismiss()) router.dismiss(2);
    else router.replace('/habits');
  };

  return (
    <SafeAreaView style={styles.screen} testID="add-bad-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackLink label="Add habit" onPress={goBack} testID="add-bad-back" />
        <Text style={styles.title} accessibilityRole="header">
          Add bad habit
        </Text>

        <BadHabitForm
          idPrefix="add-bad"
          name={name}
          onNameChange={setName}
          hint={hint}
          pair={pair}
          onPairChange={setPair}
          habits={state.habits}
          canPair={canPair}
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
          testID="add-bad-confirm"
          accessibilityRole="button"
          accessibilityLabel="Add bad habit"
          accessibilityState={{ disabled: !canAdd }}
        >
          <Text style={[styles.buttonText, !canAdd && styles.buttonTextOff]}>Add bad habit</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
