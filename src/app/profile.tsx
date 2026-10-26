// Profile (SPEC-00, T11; Figma "Profile · Phone"): a thin shell. Critter name placeholder and
// rows for Habits and Theme. Theme opens inline choices and is saved on the device. The weekly
// progress list and Weekly goal style were removed with weekly goals (P2-08a).

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textStyle } from '@/design/fonts';
import { THEME_LABELS, THEME_PREFERENCES, withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { critter, tints, type ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

type Open = 'theme' | null;

export default function ProfileScreen() {
  const styles = useStyles();
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState<Open>(null);
  const params = useLocalSearchParams<{ from?: string }>();
  // Back names the screen Profile was opened from: Test tools (T19), else Today.
  const backLabel = params.from === 'test-tools' ? 'Test tools' : 'Today';

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.screen} testID="profile-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={back}
          style={styles.back}
          testID="profile-back"
          accessibilityRole="button"
          accessibilityLabel={`Back to ${backLabel}`}
        >
          <Text style={styles.backText}>‹ {backLabel}</Text>
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

        <Row
          label="Habits"
          onPress={() => router.push({ pathname: '/habits', params: { from: 'profile' } })}
          testID="profile-habits"
        />

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
    chipOn: { backgroundColor: c.onSurface, borderColor: c.onSurface },
    chipText: { ...textStyle('label'), color: c.onSurface },
    chipTextOn: { color: c.surfaceSheet },
  });
