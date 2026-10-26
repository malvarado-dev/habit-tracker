// The Bad habits tray (PRD-15 Standalone bad habits, P2-09). A lilac tray under the habit cards
// with dark chips, so a slip is never mistaken for a habit card. Every chip keeps its count badge,
// muted "0" or lemon above 0, so chips never change size. Tap adds 1 (the badge bumps) and the
// sheet shows the Undo bar. Long-press opens a dark popover stepper (minus, count, plus) pointing
// at the chip; tapping outside closes it. Screen readers get the stepper as increment and
// decrement actions on the chip, so long-press always has a non-gesture route.

import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { badHabitColors as bad, type ThemeColors } from '@/design/tokens';
import type { BadHabit } from '@/rules/badHabits';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

type Props = {
  badHabits: BadHabit[];
  countOf: (id: string) => number;
  /** Tap: one more slip. */
  onSlip: (bad: BadHabit) => void;
  /** Stepper: set the day's count (the reducer keeps it at 0 or more). */
  onSetCount: (bad: BadHabit, count: number) => void;
  /** History before day edits (P2-18a): chips only show counts; taps are off. */
  readOnly?: boolean;
  /** History (P2-18b): a tap opens the stepper instead of counting a slip. */
  tapOpensStepper?: boolean;
  /** Called when the stepper closes. */
  onStepperClose?: () => void;
};

type Anchor = { bad: BadHabit; x: number; y: number; width: number };

export function BadHabitsTray(props: Props) {
  const { badHabits, countOf, onSlip, onSetCount, readOnly, tapOpensStepper } = props;
  const styles = useStyles();
  const [open, setOpen] = useState<Anchor | null>(null);

  if (badHabits.length === 0) return null;
  return (
    <View style={styles.tray} testID="bad-habits-section">
      <Text style={styles.title} accessibilityRole="header" testID="bad-habits-title">
        Bad habits
      </Text>
      {readOnly ? null : (
        <Text style={styles.hint}>
          {tapOpensStepper ? 'Tap to change a count' : 'Tap to count a slip'}
        </Text>
      )}
      <View style={styles.chips}>
        {badHabits.map((b) => (
          <Chip
            key={b.id}
            bad={b}
            count={countOf(b.id)}
            onSlip={() => onSlip(b)}
            onSetCount={(n) => onSetCount(b, n)}
            onOpen={(anchor) => setOpen({ bad: b, ...anchor })}
            readOnly={readOnly}
            tapOpensStepper={tapOpensStepper}
          />
        ))}
      </View>
      {open ? (
        <Stepper
          anchor={open}
          count={countOf(open.bad.id)}
          onChange={(n) => onSetCount(open.bad, n)}
          onClose={() => {
            setOpen(null);
            props.onStepperClose?.();
          }}
        />
      ) : null}
    </View>
  );
}

function Chip(props: {
  bad: BadHabit;
  count: number;
  onSlip: () => void;
  onSetCount: (count: number) => void;
  onOpen: (anchor: Omit<Anchor, 'bad'>) => void;
  readOnly?: boolean;
  tapOpensStepper?: boolean;
}) {
  const { bad: b, count } = props;
  const styles = useStyles();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const reduceMotion = useReducedMotion();
  const bump = useSharedValue(1);
  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const name = b.name || 'Bad habit';

  // The badge bumps each time the count goes up.
  const [shown, setShown] = useState(count);
  const [bumps, setBumps] = useState(0);
  if (shown !== count) {
    setShown(count);
    if (count > shown) setBumps((n) => n + 1);
  }
  useEffect(() => {
    if (bumps === 0 || reduceMotion) return;
    const { bumpScale, bumpMs } = tuning.badHabits;
    bump.set(
      withSequence(
        withTiming(bumpScale, { duration: bumpMs }),
        withTiming(1, { duration: bumpMs }),
      ),
    );
  }, [bumps, reduceMotion, bump]);

  const openStepper = () =>
    ref.current?.measureInWindow((x, y, width) => props.onOpen({ x, y, width }));

  return (
    <Pressable
      ref={ref}
      onPress={props.tapOpensStepper ? openStepper : props.onSlip}
      onLongPress={openStepper}
      disabled={props.readOnly}
      delayLongPress={tuning.badHabits.longPressMs}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      testID={`bad-chip-${b.id}`}
      accessibilityRole="adjustable"
      accessibilityLabel={`${name}, ${count} ${count === 1 ? 'slip' : 'slips'} today`}
      accessibilityHint="Tap to count a slip. Long-press to change the count."
      accessibilityValue={{ min: 0, now: count }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        props.onSetCount(count + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
      }
    >
      <Text style={styles.chipText} numberOfLines={1}>
        {name}
      </Text>
      <Animated.View
        style={[styles.badge, count > 0 ? styles.badgeOn : styles.badgeOff, bumpStyle]}
        testID={`bad-badge-${b.id}`}
      >
        <Text style={[styles.badgeText, count > 0 && styles.badgeTextOn]}>{count}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** The popover stepper, above its chip. A full-screen see-through backdrop closes it. */
function Stepper(props: {
  anchor: Anchor;
  count: number;
  onChange: (count: number) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { width: screenWidth } = useWindowDimensions();
  const { anchor, count } = props;
  const width = STEPPER_WIDTH;
  const left = Math.min(
    Math.max(space.sm, anchor.x + anchor.width / 2 - width / 2),
    screenWidth - width - space.sm,
  );
  const top = Math.max(space.sm, anchor.y - STEPPER_HEIGHT - space.sm);
  const name = anchor.bad.name || 'Bad habit';

  return (
    <Modal transparent visible animationType="none" onRequestClose={props.onClose}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={props.onClose}
        testID="bad-stepper-backdrop"
        accessibilityLabel="Close"
      />
      <View style={[styles.stepper, { left, top, width }]} testID="bad-stepper">
        <Pressable
          onPress={() => props.onChange(count - 1)}
          disabled={count <= 0}
          style={[styles.stepButton, count <= 0 && styles.off]}
          testID="bad-stepper-minus"
          accessibilityRole="button"
          accessibilityLabel={`One less ${name}`}
          accessibilityState={{ disabled: count <= 0 }}
        >
          <Text style={styles.stepGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepCount} testID="bad-stepper-count" accessibilityLiveRegion="polite">
          {count}
        </Text>
        <Pressable
          onPress={() => props.onChange(count + 1)}
          style={[styles.stepButton, styles.stepPlus]}
          testID="bad-stepper-plus"
          accessibilityRole="button"
          accessibilityLabel={`One more ${name}`}
        >
          <Text style={[styles.stepGlyph, styles.stepPlusGlyph]}>+</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const STEPPER_WIDTH = 168;
const STEPPER_HEIGHT = MIN_TAP_SIZE + space.sm * 2;
const BADGE = 22;

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    tray: {
      backgroundColor: bad.tray,
      borderRadius: radius.lg,
      padding: space.lg,
      gap: space.sm,
    },
    title: { ...textStyle('label', '700'), color: bad.onTray },
    hint: { ...textStyle('caption'), color: bad.onTrayMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
    chip: {
      minHeight: MIN_TAP_SIZE,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingLeft: space.lg,
      paddingRight: space.sm,
      borderRadius: radius.pill,
      backgroundColor: bad.chip,
    },
    pressed: { opacity: 0.8 },
    chipText: { ...textStyle('label'), color: bad.onChip },
    badge: {
      minWidth: BADGE,
      height: BADGE,
      paddingHorizontal: space.xs,
      borderRadius: BADGE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeOff: { backgroundColor: bad.badgeEmpty },
    badgeOn: { backgroundColor: c.primary },
    badgeText: { ...textStyle('caption'), color: bad.onChip },
    badgeTextOn: { color: c.onPrimary },
    stepper: {
      position: 'absolute',
      height: STEPPER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.sm,
      borderRadius: radius.pill,
      backgroundColor: c.inverse,
    },
    stepButton: {
      width: MIN_TAP_SIZE,
      height: MIN_TAP_SIZE,
      borderRadius: MIN_TAP_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepPlus: { backgroundColor: c.primary },
    off: { opacity: 0.4 },
    stepGlyph: { ...textStyle('title'), color: c.onInverse },
    stepPlusGlyph: { color: c.onPrimary },
    stepCount: { ...textStyle('habitName', '700'), color: c.onInverse },
  });
