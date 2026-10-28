// Add habit (PRD-02, P2-09; canvas "Add Habit with Bad Habits"). Create your own, then the whole
// habit catalog by category, two to a row, and the bad habits in their own lilac section at the
// bottom. Added habits are darkened with a check and can't be picked again. No plus buttons, no
// search. In Design 2, mirror bad habits (Poor Sleep, Sedentary) are hidden (PRD-15).

import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink } from '@/components/HabitForm';
import { iconLetter } from '@/components/habitCardText';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { badHabitColors as bad, tints, type ThemeColors } from '@/design/tokens';
import {
  findPremade,
  HABIT_CATEGORIES,
  isAdded,
  offeredBadHabits,
  PREMADE_HABITS,
} from '@/features/habits/premadeHabits';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useManageTracker } from '@/features/tracker/TrackerProvider';
import { HABIT_COLORS } from '@/rules/habits';
import { MIN_TAP_SIZE, radius, space } from '@/theme';
import type { Metadata } from 'expo-router/server';

import { pageTitle } from '@/components/pageTitle';

/** The page title on the web build (#113). */
export function generateMetadata(): Metadata {
  return { title: pageTitle('add-habit/index') };
}

export default function PickHabitScreen() {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const { state } = useManageTracker();
  const { badHabitDesign } = useSettings();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/habits'));
  const open = (premade?: string) =>
    router.push({ pathname: '/add-habit/details', params: premade ? { premade } : {} });
  const openBad = (premade?: string) =>
    router.push({ pathname: '/add-habit/bad', params: premade ? { premade } : {} });

  return (
    <SafeAreaView style={styles.screen} testID="pick-habit-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Manage habits" onPress={goBack} testID="pick-habit-back" />
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

        {HABIT_CATEGORIES.map((category) => (
          <View key={category} style={styles.group}>
            <Text style={styles.groupLabel} accessibilityRole="header">
              {category.toUpperCase()}
            </Text>
            <TwoColumns>
              {PREMADE_HABITS.filter((p) => p.category === category).map((p) => {
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
                      styles.item,
                      added && styles.added,
                      pressed && styles.pressed,
                    ]}
                    testID={`pick-habit-${p.key}`}
                    accessibilityRole="button"
                    // Spoken name is the visible name (#113); added shows as disabled.
                    accessibilityState={{ disabled: added }}
                  >
                    <View
                      style={[styles.icon, { backgroundColor: withAlpha(color, tints.icon) }]}
                      aria-hidden
                    >
                      <Text style={[styles.iconLetter, { color }]}>{iconLetter(p.name)}</Text>
                    </View>
                    <Text style={styles.itemName}>{p.name}</Text>
                    {added ? (
                      <Text style={styles.check} testID={`pick-habit-${p.key}-added`} aria-hidden>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </TwoColumns>
          </View>
        ))}

        <View style={styles.badSection} testID="pick-bad-habits">
          <Text style={styles.badTitle} accessibilityRole="header">
            Bad habits
          </Text>
          <Text style={styles.badHint}>
            Track your slips and we&apos;ll show you your improvement over time. No game penalties.
          </Text>
          <TwoColumns>
            {offeredBadHabits(badHabitDesign).map((b) => {
              const added = isAdded(b, state.badHabits);
              const partner = badHabitDesign === 'design1' ? findPremade(b.pairsWith) : undefined;
              return (
                <Pressable
                  key={b.key}
                  onPress={() => openBad(b.key)}
                  disabled={added}
                  style={({ pressed }) => [
                    styles.badItem,
                    added && styles.badAdded,
                    pressed && styles.pressed,
                  ]}
                  testID={`pick-bad-${b.key}`}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `${b.name}${partner ? `, pairs with ${partner.name}` : ''}` +
                    (added ? ', already added' : '')
                  }
                  accessibilityState={{ disabled: added }}
                >
                  <View style={styles.badText}>
                    <Text style={styles.badName}>{b.name}</Text>
                    {partner ? <Text style={styles.badPair}>With {partner.name}</Text> : null}
                  </View>
                  {added ? (
                    <Text style={styles.badCheck} testID={`pick-bad-${b.key}-added`}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </TwoColumns>
          <Pressable
            onPress={() => openBad()}
            style={({ pressed }) => [styles.badCreate, pressed && styles.pressed]}
            testID="pick-bad-create"
            accessibilityRole="button"
            accessibilityLabel="Create your own bad habit"
          >
            <Text style={styles.badCreateText}>+ Create your own bad habit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Two to a row. An odd last item keeps half width instead of stretching. */
function TwoColumns({ children }: { children: ReactNode[] }) {
  const styles = useStyles();
  const rows: ReactNode[][] = [];
  for (let i = 0; i < children.length; i += 2) rows.push(children.slice(i, i + 2));
  return (
    <View style={styles.grid}>
      {rows.map((row, i) => (
        <View key={i} style={styles.pairRow}>
          {row.map((child, j) => (
            <View key={j} style={styles.cell}>
              {child}
            </View>
          ))}
          {row.length === 1 ? <View style={styles.cell} /> : null}
        </View>
      ))}
    </View>
  );
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
      paddingVertical: space.xs,
      paddingLeft: space.sm,
      paddingRight: space.md,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    // Darkened, not faded (approved canvas): gray fill, full-strength text and check.
    added: { backgroundColor: c.surfaceDim, borderColor: c.surfaceDim },
    pressed: { opacity: 0.7 },
    icon: {
      width: ICON,
      height: ICON,
      borderRadius: ICON / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLetter: { ...textStyle('label') },
    // Long names wrap to a second line instead of being cut off.
    itemName: { ...textStyle('body'), color: c.onSurface, flex: 1 },
    check: { ...textStyle('habitName'), color: c.onSurface },
    badSection: {
      marginTop: space.lg,
      backgroundColor: bad.tray,
      borderRadius: radius.lg,
      padding: space.lg,
      gap: space.md,
    },
    badTitle: { ...textStyle('title'), color: bad.onTray },
    badHint: { ...textStyle('body'), color: bad.onTrayMuted },
    badItem: {
      flex: 1,
      minHeight: MIN_TAP_SIZE + space.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingVertical: space.xs,
      paddingLeft: space.lg,
      paddingRight: space.md,
      borderRadius: radius.pill,
      backgroundColor: bad.chip,
    },
    badAdded: { backgroundColor: bad.chipAdded },
    badText: { flex: 1, gap: 1 },
    badName: { ...textStyle('label'), color: bad.onChip },
    badPair: { ...textStyle('caption'), color: bad.onChipMuted },
    badCheck: { ...textStyle('habitName'), color: c.primary },
    badCreate: {
      minHeight: MIN_TAP_SIZE + space.sm,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: bad.createBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badCreateText: { ...textStyle('label'), color: bad.onTray },
  });
