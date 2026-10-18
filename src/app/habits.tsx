// Habits & Mode: one screen for the mode and for adding, renaming, removing habits and
// setting weekly targets (SPEC-00, PRD-02). Opened by tapping the mode label.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_TARGET, MIN_TARGET } from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { RANK_CUTOFFS, type Mode } from '@/rules/rank';
import { colors, font, MIN_TAP_SIZE, radius, space } from '@/theme';

const MODES: Mode[] = ['Beginner', 'Challenger', 'Pro'];

export default function HabitsScreen() {
  const { state, dispatch } = useTracker();
  const [newName, setNewName] = useState('');
  const canRemove = state.habits.length > 1;

  const addHabit = () => {
    if (!newName.trim()) return;
    dispatch({ type: 'addHabit', id: `habit-${Date.now()}`, name: newName });
    setNewName('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.backButton}
              testID="back-button"
              accessibilityRole="button"
              accessibilityLabel="Back to today"
            >
              <Text style={styles.backText}>‹ Today</Text>
            </Pressable>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Habits & Mode
          </Text>

          <Text style={styles.section} accessibilityRole="header">
            Mode
          </Text>
          <View style={styles.modeRow} accessibilityRole="radiogroup">
            {MODES.map((mode) => {
              const selected = state.mode === mode;
              const s = Math.round(RANK_CUTOFFS[mode].S * 100);
              return (
                <Pressable
                  key={mode}
                  onPress={() => dispatch({ type: 'setMode', mode })}
                  style={[styles.modeOption, selected && styles.modeSelected]}
                  testID={`mode-option-${mode.toLowerCase()}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${mode}. S rank at ${s} percent.`}
                >
                  <Text style={[styles.modeName, selected && styles.modeNameSelected]}>{mode}</Text>
                  <Text style={[styles.modeDetail, selected && styles.modeNameSelected]}>
                    S at {s}%
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.help}>
            Harder modes need higher scores for each rank. You can switch any time.
          </Text>

          <Text style={styles.section} accessibilityRole="header">
            Habits
          </Text>
          {state.habits.map((habit) => (
            <View key={habit.id} style={styles.habitRow} testID={`habit-row-${habit.id}`}>
              <TextInput
                value={habit.name}
                onChangeText={(name) => dispatch({ type: 'renameHabit', habitId: habit.id, name })}
                style={styles.nameInput}
                placeholder="Habit name"
                placeholderTextColor={colors.textMuted}
                testID={`habit-name-${habit.id}`}
                accessibilityLabel={`Name for ${habit.name || 'habit'}`}
              />
              <View style={styles.targetRow}>
                <StepButton
                  label="−"
                  a11y={`Fewer days for ${habit.name}`}
                  disabled={habit.weeklyTarget <= MIN_TARGET}
                  testID={`target-down-${habit.id}`}
                  onPress={() =>
                    dispatch({
                      type: 'setWeeklyTarget',
                      habitId: habit.id,
                      weeklyTarget: habit.weeklyTarget - 1,
                    })
                  }
                />
                <Text style={styles.target} testID={`target-value-${habit.id}`}>
                  {habit.weeklyTarget}/wk
                </Text>
                <StepButton
                  label="+"
                  a11y={`More days for ${habit.name}`}
                  disabled={habit.weeklyTarget >= MAX_TARGET}
                  testID={`target-up-${habit.id}`}
                  onPress={() =>
                    dispatch({
                      type: 'setWeeklyTarget',
                      habitId: habit.id,
                      weeklyTarget: habit.weeklyTarget + 1,
                    })
                  }
                />
                <Pressable
                  onPress={() => dispatch({ type: 'removeHabit', habitId: habit.id })}
                  disabled={!canRemove}
                  style={[styles.removeButton, !canRemove && styles.disabled]}
                  testID={`remove-habit-${habit.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${habit.name}`}
                  accessibilityState={{ disabled: !canRemove }}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
              {!habit.name.trim() ? (
                <Text style={styles.warning}>Give this habit a name.</Text>
              ) : null}
            </View>
          ))}
          {!canRemove ? <Text style={styles.help}>You need at least one habit.</Text> : null}

          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={addHabit}
              style={[styles.nameInput, styles.addInput]}
              placeholder="New habit, like Reading"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              testID="new-habit-input"
              accessibilityLabel="New habit name"
            />
            <Pressable
              onPress={addHabit}
              disabled={!newName.trim()}
              style={[styles.addButton, !newName.trim() && styles.disabled]}
              testID="add-habit-button"
              accessibilityRole="button"
              accessibilityLabel="Add habit"
              accessibilityState={{ disabled: !newName.trim() }}
            >
              <Text style={styles.addText}>Add habit</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepButton(props: {
  label: string;
  a11y: string;
  disabled: boolean;
  testID: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[styles.stepButton, props.disabled && styles.disabled]}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.a11y}
      accessibilityState={{ disabled: props.disabled }}
    >
      <Text style={styles.stepText}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { alignItems: 'center', paddingVertical: space.lg },
  page: { width: '100%', maxWidth: 560, paddingHorizontal: space.lg, gap: space.md },
  topBar: { flexDirection: 'row' },
  backButton: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', paddingRight: space.lg },
  backText: { color: colors.accent, fontWeight: '700', fontSize: font.body },
  title: { fontSize: font.large, fontWeight: '800', color: colors.text },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: space.md },
  help: { fontSize: font.small, color: colors.textMuted },
  warning: { fontSize: font.small, color: colors.danger },
  modeRow: { flexDirection: 'row', gap: space.sm },
  modeOption: {
    flex: 1,
    minHeight: MIN_TAP_SIZE + space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.sm,
  },
  modeSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeName: { fontWeight: '800', color: colors.text },
  modeDetail: { fontSize: font.small, color: colors.textMuted },
  modeNameSelected: { color: colors.accentText },
  habitRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  nameInput: {
    minHeight: MIN_TAP_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepButton: {
    width: MIN_TAP_SIZE,
    height: MIN_TAP_SIZE,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: { fontSize: font.title, fontWeight: '800', color: colors.text },
  target: { minWidth: 48, textAlign: 'center', fontWeight: '700', color: colors.text },
  removeButton: { marginLeft: 'auto', minHeight: MIN_TAP_SIZE, justifyContent: 'center' },
  removeText: { color: colors.danger, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  addRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  addInput: { flex: 1 },
  addButton: {
    minHeight: MIN_TAP_SIZE,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  addText: { color: colors.accentText, fontWeight: '800' },
});
