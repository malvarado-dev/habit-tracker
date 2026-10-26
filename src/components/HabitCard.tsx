// One habit card (PRD-15 Cards, P2-08a). A white pill with a letter icon and the habit's name.
// One tap logs one time, with a quick press and a light haptic. Habits done more than once a day
// show a segmented gold ring around the icon and a count ("3/8"); each log fills its segment
// clockwise with the Activity Bar's easing. Once-a-day habits show no ring and no count.
// Stars, swipes, Skip and weekly goals were removed in P2-08a; slide actions come in P2-08b.
// Reduced motion: no press scale, and segments fill without moving.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { textStyle } from '@/design/fonts';
import { habitCardSizes as size, history, shadows, tints } from '@/design/tokens';
import type { ThemeColors } from '@/design/tokens';
import { timesPerDay, type Habit } from '@/rules/habits';
import { arcLength, arcPath, ringFor, segmentArcs } from '@/rules/ring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { cardAccessibilityLabel, iconLetter } from './habitCardText';
import { fillEasing, fillMs } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface HabitCardProps {
  habit: Habit;
  /** Logs so far on the card's day. */
  count: number;
  /** One tap: log one more time. */
  onLog: () => void;
  /** A locked day in History (T16): dimmed, and taps are off. */
  locked?: boolean;
}

export function HabitCard({ habit, count, onLog, locked = false }: HabitCardProps) {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const habitColor = c[habit.color];
  const times = timesPerDay(habit);
  const ring = ringFor(times, count);
  const name = habit.name.trim() || 'Untitled habit';
  const id = habit.id;

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const log = () => {
    if (locked) return;
    const finishes = count + 1 >= times;
    // Haptics never block the tap; a phone or browser without them just stays quiet.
    const buzz = finishes
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    buzz.catch(() => {});
    if (!reduceMotion) {
      const { pressScale, pressMs } = tuning.card;
      scale.set(
        withSequence(
          withTiming(pressScale, { duration: pressMs }),
          withTiming(1, { duration: pressMs }),
        ),
      );
    }
    onLog();
  };

  return (
    <Animated.View style={[scaleStyle, locked && { opacity: history.lockedCardOpacity }]}>
      <Pressable
        onPress={log}
        disabled={locked}
        accessibilityState={{ disabled: locked }}
        testID={`habit-card-${id}`}
        accessibilityRole="button"
        accessibilityLabel={cardAccessibilityLabel(name, count, times)}
        accessibilityHint={locked ? 'This day is locked.' : 'Tap to log one time.'}
        style={[styles.card, { backgroundColor: c.surface }]}
      >
        <View importantForAccessibility="no-hide-descendants" style={styles.row}>
          {ring ? (
            <SegmentRing id={id} segments={ring.segments} filled={ring.filled}>
              <LetterIcon id={id} name={name} color={habitColor} />
            </SegmentRing>
          ) : (
            <View style={styles.ringSlot}>
              <LetterIcon id={id} name={name} color={habitColor} />
            </View>
          )}

          <Text style={styles.name} numberOfLines={1} testID={`habit-name-${id}`}>
            {name}
          </Text>

          {ring ? (
            <Text style={styles.count} testID={`habit-count-${id}`}>
              {ring.label}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** The letter placeholder in a tinted circle, until the icon sheet. */
function LetterIcon({ id, name, color }: { id: string; name: string; color: string }) {
  const styles = useStyles();
  return (
    <View
      style={[styles.icon, { backgroundColor: withAlpha(color, tints.icon) }]}
      testID={`habit-icon-${id}`}
    >
      <Text style={[styles.iconLetter, { color }]}>{iconLetter(name)}</Text>
    </View>
  );
}

/**
 * One segment per time a day around the icon, filled gold clockwise from the top. The ring's
 * accessibility label carries the count, so tests and screen readers can read it.
 */
function SegmentRing(props: {
  id: string;
  segments: number;
  filled: number;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  const { ring: r } = tuning;
  const center = size.ring / 2;
  const radiusPx = center - r.stroke / 2 - 1;
  const arcs = segmentArcs(props.segments, r.gapDegrees);
  return (
    <View
      style={styles.ringSlot}
      testID={`habit-ring-${props.id}`}
      accessibilityLabel={`${props.filled} of ${props.segments} done today`}
    >
      <Svg width={size.ring} height={size.ring} style={styles.ringSvg}>
        {arcs.map((arc, i) => (
          <RingSegment
            key={i}
            d={arcPath(center, radiusPx, arc)}
            length={arcLength(radiusPx, arc)}
            filled={i < props.filled}
          />
        ))}
      </Svg>
      {props.children}
    </View>
  );
}

/** A track arc with a gold arc over it that draws in along the arc when the segment fills. */
function RingSegment({ d, length, filled }: { d: string; length: number; filled: boolean }) {
  const reduceMotion = useReducedMotion();
  const { ring: r } = tuning;
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    const to = filled ? 1 : 0;
    progress.set(reduceMotion ? to : withTiming(to, { duration: fillMs, easing: fillEasing }));
  }, [filled, reduceMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return (
    <>
      <Path d={d} stroke={r.track} strokeWidth={r.stroke} strokeLinecap="round" fill="none" />
      <AnimatedPath
        d={d}
        stroke={r.gold}
        strokeWidth={r.stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${length} ${length}`}
        animatedProps={animatedProps}
      />
    </>
  );
}

function useStyles() {
  const { colors, scheme } = useTheme();
  return useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      minHeight: MIN_TAP_SIZE + space.lg,
      borderRadius: radius.pill,
      // A hairline reads on the light sheet; dark needs a full point to hold the edge.
      borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
      borderColor: c.border,
      boxShadow: shadows.card,
      paddingVertical: space.sm,
      paddingLeft: space.sm,
      paddingRight: space.lg + 2,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    ringSlot: {
      width: size.ring,
      height: size.ring,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringSvg: { position: 'absolute' },
    icon: {
      width: size.icon,
      height: size.icon,
      borderRadius: size.icon / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLetter: textStyle('habitName', '700'),
    name: { ...textStyle('habitName'), color: c.onSurface, flex: 1 },
    count: { ...textStyle('label', '700'), color: c.onSurfaceMuted },
  });
