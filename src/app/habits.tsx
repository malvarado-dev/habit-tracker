// Habits: add, rename, and remove habits, and change Any days goals (SPEC-00).
// Temporary screen from the first build. T12 rebuilds it with the Specific days picker.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_TIMES, MIN_TIMES } from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { goalCount, type Habit } from '@/rules/scoring';
import { colors, font, MIN_TAP_SIZE, radius, space } from '@/theme';

function goalLabel(habit: Habit): string {
  const n = goalCount(habit.goal);
  return habit.goal.kind === 'anyDays' ? `${n}x/wk` : `${n} days`;
}

export default function HabitsScreen() {
  const { state, dispatch } = useTracker();
  const [newName, setNewName] = useState('');
  const canRemove = state.habits.length > 1;

  const changeTimes = (habit: Habit, by: number) => {
    if (habit.goal.kind !== 'anyDays') return;
    const goal = { kind: 'anyDays', timesPerWeek: habit.goal.timesPerWeek + by } as const;
    dispatch({ type: 'setGoal', habitId: habit.id, goal });
  };

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
            Habits
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
                  a11y={`Fewer times a week for ${habit.name}`}
                  disabled={habit.goal.kind !== 'anyDays' || habit.goal.timesPerWeek <= MIN_TIMES}
                  testID={`target-down-${habit.id}`}
                  onPress={() => changeTimes(habit, -1)}
                />
                <Text style={styles.target} testID={`target-value-${habit.id}`}>
                  {goalLabel(habit)}
                </Text>
                <StepButton
                  label="+"
                  a11y={`More times a week for ${habit.name}`}
                  disabled={habit.goal.kind !== 'anyDays' || habit.goal.timesPerWeek >= MAX_TIMES}
                  testID={`target-up-${habit.id}`}
                  onPress={() => changeTimes(habit, 1)}
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
