// Add bad habit (PRD-02, P2-09; canvas "Add Habit with Bad Habits"). A catalog bad habit opens
// pre-filled, with its catalog pairing picked when the user has that good habit; Create your own
// opens empty. Design 1 can pair it with one good habit (logged by sliding that card, P2-08b) or
// leave it standalone (counted in the Bad habits tray). Design 2 has no pairing.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink } from '@/components/HabitForm';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { MAX_NAME_LENGTH, nameCounter, nameHint, nameProblem } from '@/features/habits/habitName';
import { findPremadeBad, suggestedPair } from '@/features/habits/premadeHabits';
import { useSettings } from '@/features/settings/SettingsProvider';
import { MAX_BAD_HABITS } from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

export default function AddBadHabitScreen() {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const { state, dispatch, today } = useTracker();
  const { badHabitDesign } = useSettings();
  const params = useLocalSearchParams<{ premade?: string }>();
  const premade = findPremadeBad(params.premade);
  const [name, setName] = useState(premade?.name ?? '');
  const [pair, setPair] = useState<string | undefined>(() => suggestedPair(premade, state.habits));
  const canPair = badHabitDesign === 'design1';

  const names = [...state.habits, ...state.badHabits];
  const full = state.badHabits.length >= MAX_BAD_HABITS;
  const canAdd = !full && nameProblem(name, names) === null;
  const hint = full ? '15 bad habits is the most.' : nameHint(name, names);
  const counter = nameCounter(name);

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

  const options = [{ id: undefined, name: 'None' }, ...state.habits];

  return (
    <SafeAreaView style={styles.screen} testID="add-bad-habit-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackLink label="Add habit" onPress={goBack} testID="add-bad-back" />
        <Text style={styles.title} accessibilityRole="header">
          Add bad habit
        </Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Bad habit name"
          placeholderTextColor={c.onSurfaceMuted}
          maxLength={MAX_NAME_LENGTH}
          testID="add-bad-name"
          accessibilityLabel="Bad habit name"
        />
        {hint || counter ? (
          <View style={styles.hintRow}>
            <Text style={styles.hint} testID="add-bad-name-hint" accessibilityLiveRegion="polite">
              {hint}
            </Text>
            <Text style={styles.hint}>{counter}</Text>
          </View>
        ) : null}

        {canPair ? (
          <View style={styles.pairBlock}>
            <Text style={styles.label}>PAIR WITH A GOOD HABIT</Text>
            <Text style={styles.body}>
              Optional. Paired, you log a slip by sliding the good habit&apos;s card. Not paired, it
              shows in your Bad habits tray.
            </Text>
            <View
              style={styles.chips}
              accessibilityRole="radiogroup"
              accessibilityLabel="Pair with"
            >
              {options.map((o) => {
                const on = o.id === pair;
                return (
                  <Pressable
                    key={o.id ?? 'none'}
                    onPress={() => setPair(o.id)}
                    style={[styles.chip, on && styles.chipOn]}
                    testID={`add-bad-pair-${o.id ?? 'none'}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={o.name}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

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
    label: { ...textStyle('label'), color: c.onSurfaceMuted },
    body: { ...textStyle('body'), color: c.onSurfaceMuted },
    input: {
      ...textStyle('habitName'),
      color: c.onSurface,
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: space.xl,
    },
    hintRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
    hint: { ...textStyle('caption'), color: c.onSurfaceMuted },
    pairBlock: { gap: space.sm, marginTop: space.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    chip: {
      minHeight: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      justifyContent: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipOn: { backgroundColor: c.onSurface, borderColor: c.onSurface },
    chipText: { ...textStyle('label'), color: c.onSurfaceMuted },
    chipTextOn: { color: c.surfaceSheet },
    spacer: { flexGrow: 1, minHeight: space.xl },
    button: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    buttonOff: { backgroundColor: c.surfaceDim },
    buttonText: { ...textStyle('label'), color: c.onPrimary },
    buttonTextOff: { color: c.onSurfaceMuted },
    pressed: { opacity: 0.7 },
  });
