// Shared name and optional pairing fields for Add/Edit bad habit (#132).
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { MAX_NAME_LENGTH, nameCounter } from '@/features/habits/habitName';
import type { Habit } from '@/rules/habits';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

interface Props {
  idPrefix: string;
  name: string;
  onNameChange: (name: string) => void;
  hint: string;
  pair?: string;
  onPairChange: (id: string | undefined) => void;
  habits: Habit[];
  canPair: boolean;
}

export function BadHabitForm({
  idPrefix,
  name,
  onNameChange,
  hint,
  pair,
  onPairChange,
  habits,
  canPair,
}: Props) {
  const styles = useBadHabitStyles();
  const { colors: c } = useTheme();
  const counter = nameCounter(name);
  const options = [{ id: undefined, name: 'None' }, ...habits];
  return (
    <>
      <Text style={styles.label}>NAME</Text>
      <TextInput
        value={name}
        onChangeText={onNameChange}
        style={styles.input}
        placeholder="Bad habit name"
        placeholderTextColor={c.onSurfaceMuted}
        maxLength={MAX_NAME_LENGTH}
        testID={`${idPrefix}-name`}
        accessibilityLabel="Bad habit name"
      />
      {hint || counter ? (
        <View style={styles.hintRow}>
          <Text
            style={styles.hint}
            testID={`${idPrefix}-name-hint`}
            accessibilityLiveRegion="polite"
          >
            {hint}
          </Text>
          <Text style={styles.hint}>{counter}</Text>
        </View>
      ) : null}

      {canPair ? (
        <View style={styles.pairBlock}>
          <Text style={styles.label}>PAIR WITH A GOOD HABIT</Text>
          <Text style={styles.body}>
            If it gets in the way of a good habit, pair them. For example, pair Eat Out with Eat
            Healthy to track cheat meals.
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Pair with">
            {options.map((o) => {
              const on = o.id === pair;
              return (
                <Pressable
                  key={o.id ?? 'none'}
                  onPress={() => onPairChange(o.id)}
                  style={[styles.chip, on && styles.chipOn]}
                  testID={`${idPrefix}-pair-${o.id ?? 'none'}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  aria-checked={on}
                  accessibilityLabel={o.name}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </>
  );
}

export function useBadHabitStyles() {
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
    pressed: { opacity: tuning.habits.pressedOpacity },
  });
