// Pick a habit (SPEC-00, T13; Figma "Add habit · Pick a habit"). Titled "Add habit" on screen.
// Create your own, then the premade habits in groups, two to a row. Already-added habits are
// dimmed with a check and can't be picked again. No search.

import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink } from '@/components/HabitForm';
import { iconLetter } from '@/components/habitCardText';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { tints, type ThemeColors } from '@/design/tokens';
import { isAdded, PREMADE_GROUPS, PREMADE_HABITS } from '@/features/habits/premadeHabits';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { HABIT_COLORS } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

export default function PickHabitScreen() {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const { state } = useTracker();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/habits'));
  const open = (premade?: string) =>
    router.push({ pathname: '/add-habit/details', params: premade ? { premade } : {} });

  return (
    <SafeAreaView style={styles.screen} testID="pick-habit-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Habits" onPress={goBack} testID="pick-habit-back" />
        <Text style={styles.title} accessibilityRole="header">
          Add habit
        </Text>

        <Pressable
          onPress={() => open()}
          style={({ pressed }) => [styles.create, pressed && styles.pressed]}
          testID="pick-habit-create"
          accessibilityRole="button"
          accessibilityLabel="Create your own habit"
        >
          <Text style={styles.createText}>+ Create your own</Text>
        </Pressable>

        {PREMADE_GROUPS.map((group) => (
          <View key={group} style={styles.group}>
            <Text style={styles.groupLabel} accessibilityRole="header">
              {group.toUpperCase()}
            </Text>
            <View style={styles.grid}>
              {pairs(PREMADE_HABITS.filter((p) => p.group === group)).map((pair) => (
                <View key={pair[0].key} style={styles.pairRow}>
                  {pair.map((p) => {
                    const added = isAdded(p, state.habits);
                    const index = PREMADE_HABITS.indexOf(p);
                    // Display only: the new habit's real color is the least-used one.
                    const color = c[HABIT_COLORS[index % HABIT_COLORS.length]!];
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => open(p.key)}
                        disabled={added}
                        style={({ pressed }) => [
                          styles.cell,
                          styles.item,
                          added && styles.added,
                          pressed && styles.pressed,
                        ]}
                        testID={`pick-habit-${p.key}`}
                        accessibilityRole="button"
                        accessibilityLabel={added ? `${p.name}, already added` : p.name}
                        accessibilityState={{ disabled: added }}
                      >
                        <View
                          style={[styles.icon, { backgroundColor: withAlpha(color, tints.icon) }]}
                        >
                          <Text style={[styles.iconLetter, { color }]}>{iconLetter(p.name)}</Text>
                        </View>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        {added ? (
                          <Text style={styles.check} testID={`pick-habit-${p.key}-added`}>
                            ✓
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {/* An odd last habit keeps half width instead of stretching. */}
                  {pair.length === 1 ? <View style={styles.cell} /> : null}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Two to a row: [[a, b], [c, d], [e]]. */
function pairs<T>(items: T[]): [T, ...T[]][] {
  const rows: [T, ...T[]][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2) as [T, ...T[]]);
  return rows;
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const ICON = 28;

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surfaceSheet },
    content: {
      padding: space.lg,
      paddingBottom: space.xxl,
      gap: space.md,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    title: { ...textStyle('display'), color: c.onSurface, marginBottom: space.sm },
    create: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.onSurface,
    },
    createText: { ...textStyle('label'), color: c.surfaceSheet },
    group: { gap: space.sm, marginTop: space.sm },
    groupLabel: { ...textStyle('caption'), color: c.onSurfaceMuted },
    grid: { gap: space.sm },
    pairRow: { flexDirection: 'row', gap: space.sm },
    cell: { flex: 1 },
    item: {
      flex: 1,
      minHeight: MIN_TAP_SIZE,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingLeft: space.sm,
      paddingRight: space.md,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    added: { backgroundColor: c.surfaceDim, opacity: 0.6 },
    pressed: { opacity: 0.7 },
    icon: {
      width: ICON,
      height: ICON,
      borderRadius: ICON / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLetter: { ...textStyle('label') },
    itemName: { ...textStyle('body'), color: c.onSurface, flex: 1 },
    check: { ...textStyle('habitName'), color: c.onSurface },
  });
