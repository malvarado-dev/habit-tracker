// Profile (SPEC-00, T11; Figma "Profile · Phone"): a thin shell. Critter name placeholder,
// this week's progress per habit, and rows for Habits, Weekly goal style, and Theme.
// The two settings open inline choices and are saved on the device.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { weekProgressText } from '@/components/habitCardText';
import { textStyle } from '@/design/fonts';
import { THEME_LABELS, THEME_PREFERENCES, withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { critter, tints, type ThemeColors } from '@/design/tokens';
import { GOAL_STYLE_LABELS, GOAL_STYLES } from '@/features/settings/settings';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getWeekProgress } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

type Open = 'goal' | 'theme' | null;

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors: c, preference, setPreference } = useTheme();
  const { goalStyle, setGoalStyle } = useSettings();
  const { state, today } = useTracker();
  const [open, setOpen] = useState<Open>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.screen} testID="profile-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={back}
          style={styles.back}
          testID="profile-back"
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
        >
          <Text style={styles.backText}>‹ Today</Text>
        </Pressable>

        <View style={styles.avatar} testID="profile-avatar" />
        <Text style={styles.name} accessibilityRole="header" testID="profile-name">
          You
        </Text>

        <View style={styles.card} testID="profile-critter-name">
          <View style={styles.critterIcon}>
            <View style={styles.critterBody} />
            <View style={[styles.eye, { left: 16 }]} />
            <View style={[styles.eye, { left: 26 }]} />
          </View>
          <Text style={styles.rowText}>Critter name (placeholder)</Text>
        </View>

        <Text style={styles.section}>THIS WEEK</Text>
        <View style={styles.week} testID="profile-week">
          {state.habits.map((habit) => {
            const p = getWeekProgress(habit, state.log, today);
            return (
              <View
                key={habit.id}
                style={styles.weekRow}
                testID={`profile-week-${habit.id}`}
                accessible
                accessibilityLabel={`${habit.name}, ${weekProgressText(p.done, p.goal)}`}
              >
                <Text style={styles.weekName} numberOfLines={1}>
                  {habit.name}
                </Text>
                <Text style={styles.weekCount}>
                  {p.done} of {p.goal}
                </Text>
                <MiniRing color={c[habit.color]} track={c.onSurface} done={p.done} goal={p.goal} />
              </View>
            );
          })}
        </View>

        <Row label="Habits" onPress={() => router.push('/habits')} testID="profile-habits" />

        <Row
          label="Weekly goal style"
          value={GOAL_STYLE_LABELS[goalStyle]}
          expanded={open === 'goal'}
          onPress={() => setOpen(open === 'goal' ? null : 'goal')}
          testID="profile-goal-style"
        />
        {open === 'goal' ? (
          <Choices
            options={GOAL_STYLES.map((s) => ({ key: s, label: GOAL_STYLE_LABELS[s] }))}
            selected={goalStyle}
            onSelect={(s) => setGoalStyle(s as typeof goalStyle)}
            testID="profile-goal-style"
          />
        ) : null}

        <Row
          label="Theme"
          value={THEME_LABELS[preference]}
          expanded={open === 'theme'}
          onPress={() => setOpen(open === 'theme' ? null : 'theme')}
          testID="profile-theme"
        />
        {open === 'theme' ? (
          <Choices
            options={THEME_PREFERENCES.map((t) => ({ key: t, label: THEME_LABELS[t] }))}
            selected={preference}
            onSelect={(t) => setPreference(t as typeof preference)}
            testID="profile-theme"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: {
  label: string;
  value?: string;
  expanded?: boolean;
  onPress: () => void;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.value ? `${props.label}, ${props.value}` : props.label}
      accessibilityState={props.expanded === undefined ? undefined : { expanded: props.expanded }}
    >
      <Text style={styles.rowText}>{props.label}</Text>
      <View style={styles.rowRight}>
        {props.value ? <Text style={styles.rowValue}>{props.value}</Text> : null}
        <Text style={styles.chevron}>{props.expanded ? '⌄' : '›'}</Text>
      </View>
    </Pressable>
  );
}

function Choices(props: {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
  testID: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.choices}>
      {props.options.map((o) => {
        const on = o.key === props.selected;
        return (
          <Pressable
            key={o.key}
            onPress={() => props.onSelect(o.key)}
            style={[styles.chip, on && styles.chipOn]}
            testID={`${props.testID}-${o.key}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const RING = 28;
const STROKE = 3;

function MiniRing(props: { color: string; track: string; done: number; goal: number }) {
  const center = RING / 2;
  const r = center - STROKE / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const fraction = props.goal > 0 ? Math.min(props.done / props.goal, 1) : 0;
  return (
    <Svg width={RING} height={RING}>
      <Circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={withAlpha(props.track, tints.ringTrack)}
        strokeWidth={STROKE}
      />
      {fraction > 0 ? (
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={props.color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ) : null}
    </Svg>
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
      padding: space.lg,
      gap: space.md,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    back: { minHeight: MIN_TAP_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
    backText: { ...textStyle('habitName'), color: c.onSurface },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignSelf: 'center',
      backgroundColor: withAlpha(c.onSurface, tints.ringTrack),
    },
    name: { ...textStyle('habitName', '700'), color: c.onSurface, alignSelf: 'center' },
    card: {
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    critterIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: withAlpha(c.onSurface, tints.ringTrack),
    },
    critterBody: {
      position: 'absolute',
      left: 6,
      right: 6,
      top: 20,
      bottom: -10,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      backgroundColor: critter.bodySunny,
    },
    eye: {
      position: 'absolute',
      top: 28,
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: critter.ink,
    },
    section: { ...textStyle('label'), color: c.onSurfaceMuted, marginTop: space.sm },
    week: { gap: space.md, marginBottom: space.md },
    weekRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    weekName: { ...textStyle('habitName'), color: c.onSurface, flex: 1 },
    weekCount: { ...textStyle('label'), color: c.onSurfaceMuted },
    row: { justifyContent: 'space-between', paddingHorizontal: space.lg },
    rowText: { ...textStyle('habitName'), color: c.onSurface },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    rowValue: { ...textStyle('habitName'), color: c.onSurfaceMuted },
    chevron: { ...textStyle('habitName'), color: c.onSurfaceMuted },
    pressed: { opacity: 0.7 },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.sm },
    chip: {
      minHeight: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      borderRadius: radius.pill,
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { backgroundColor: c.inverse, borderColor: c.inverse },
    chipText: { ...textStyle('label'), color: c.onSurface },
    chipTextOn: { color: c.onInverse },
  });
