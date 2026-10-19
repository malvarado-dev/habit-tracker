// One habit card (design-spendio.md, Habit Card). A white pill: the weekly goal (progress
// ring around a letter icon, or progress dots under the name), the name, three stars, and
// one status slot. Tap cycles Started, On track, Nailed it, Skip, back to To do,
// so the same tap works as undo. Swipes are shortcuts, never the only way: full right = Nailed it,
// full left = Skip. Short swipes were dropped in T6; vertical drags scroll and never score.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import type { GoalStyle } from '@/features/settings/settings';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { textStyle } from '@/design/fonts';
import { habitCardSizes as size, shadows, tints, typography } from '@/design/tokens';
import type { ThemeColors } from '@/design/tokens';
import { MAX_STARS, STARS, type CheckIn, type Habit } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { CardEffect } from './CardEffect';
import { cardMotion } from './cardEffectLayout';
import { cardAccessibilityLabel, iconLetter, statusText, weekProgressText } from './habitCardText';

export type { GoalStyle } from '@/features/settings/settings';

interface HabitCardProps {
  habit: Habit;
  checkIn: CheckIn | undefined;
  /** Due today: an unscored card says "To do". */
  isDue: boolean;
  /** Days this week scored Started or better, and the weekly goal. */
  progress: { done: number; goal: number };
  /** Ring is the default; Dots is the Profile option (SPEC-00). */
  goalStyle: GoalStyle;
  onTap: () => void;
  onSwipe: (checkIn: CheckIn) => void;
}

export function HabitCard(props: HabitCardProps) {
  const { habit, checkIn, isDue, progress, goalStyle, onTap, onSwipe } = props;
  const styles = useStyles();
  const { colors: c } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);
  const habitColor = c[habit.color];

  // Play the in-card effect only when the score changes, not for scores already saved.
  const [shownCheckIn, setShownCheckIn] = useState(checkIn);
  const [burstId, setBurstId] = useState(0);
  if (shownCheckIn !== checkIn) {
    setShownCheckIn(checkIn);
    setBurstId((n) => n + 1);
  }
  const reduceMotion = useReducedMotion();
  const fx = tuning.card.effects;
  const scale = useSharedValue(1);
  const dim = useSharedValue(checkIn === 'NotToday' ? 1 : 0);
  const flash = useSharedValue(1);

  // Card motion, the Skip dim, and the reduced-motion star flash, once per score change.
  useEffect(() => {
    if (burstId === 0) return;
    const dimTo = checkIn === 'NotToday' ? 1 : 0;
    dim.value = reduceMotion ? dimTo : withTiming(dimTo, { duration: fx.dimMs });
    if (reduceMotion) {
      if (checkIn && checkIn !== 'NotToday') {
        flash.value = withSequence(
          withTiming(fx.flashOpacity, { duration: fx.flashMs / 2 }),
          withTiming(1, { duration: fx.flashMs / 2 }),
        );
      }
      return;
    }
    const motion = cardMotion(checkIn);
    if (motion === 'pulse') {
      scale.value = withSequence(
        withTiming(fx.pulseScale, { duration: fx.pulseMs }),
        withTiming(1, { duration: fx.pulseMs }),
      );
    }
  }, [burstId, checkIn, reduceMotion, dim, flash, scale, fx]);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const effectColors = {
    started: c.scoreStartedStar,
    onTrack: c.scoreOnTrackStar,
    nailedIt: c.scoreNailedItStar,
    habit: habitColor,
  };

  const stars = checkIn ? STARS[checkIn] : 0;
  const name = habit.name.trim() || 'Untitled habit';
  const id = habit.id;

  const handleSwipe = (direction: SwipeDirection.LEFT | SwipeDirection.RIGHT) => {
    onSwipe(direction === SwipeDirection.RIGHT ? 'NailedIt' : 'NotToday');
    swipeRef.current?.close();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={1.5}
      leftThreshold={tuning.card.swipeThreshold}
      rightThreshold={tuning.card.swipeThreshold}
      dragOffsetFromLeft={tuning.card.swipeStartOffset}
      dragOffsetFromRight={-tuning.card.swipeStartOffset}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => <SwipeHint text="Nailed it" color={c.scoreNailedIt} start />}
      renderRightActions={() => <SwipeHint text="Skip" color={c.onSurfaceMuted} />}
      onSwipeableWillOpen={handleSwipe}
      containerStyle={styles.swipeContainer}
    >
      <Animated.View style={scaleStyle}>
        <Pressable
          onPress={onTap}
          testID={`habit-card-${id}`}
          accessibilityRole="button"
          accessibilityLabel={cardAccessibilityLabel(
            name,
            checkIn,
            isDue,
            progress.done,
            progress.goal,
          )}
          accessibilityHint="Tap to change the score. Swipe right for Nailed it, left for Skip."
          accessibilityActions={[
            { name: 'nailedIt', label: 'Nailed it' },
            { name: 'notToday', label: 'Skip' },
          ]}
          onAccessibilityAction={(e) =>
            onSwipe(e.nativeEvent.actionName === 'nailedIt' ? 'NailedIt' : 'NotToday')
          }
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: c.surface },
            pressed && styles.pressed,
          ]}
        >
          <Animated.View
            pointerEvents="none"
            testID={`habit-dim-${id}`}
            style={[styles.dim, { backgroundColor: c.surfaceDim }, dimStyle]}
          />
          <View importantForAccessibility="no-hide-descendants" style={styles.row}>
            {goalStyle === 'ring' ? (
              <ProgressRing id={id} color={habitColor} track={c.onSurface} {...progress}>
                <LetterIcon id={id} name={name} color={habitColor} />
              </ProgressRing>
            ) : (
              <LetterIcon id={id} name={name} color={habitColor} />
            )}

            <View style={styles.textBlock}>
              <Text style={styles.name} numberOfLines={1} testID={`habit-name-${id}`}>
                {name}
              </Text>
              {goalStyle === 'dots' ? (
                <ProgressDots id={id} color={habitColor} {...progress} />
              ) : null}
            </View>

            <View style={styles.right}>
              <Animated.View style={[styles.stars, flashStyle]} testID={`habit-stars-${id}`}>
                {Array.from({ length: MAX_STARS }, (_, i) => (
                  <Text
                    key={i}
                    testID={`habit-star-${id}-${i + 1}`}
                    style={[styles.star, { color: starColor(c, checkIn, i < stars) }]}
                  >
                    {i < stars || checkIn === 'NotToday' ? '★' : '☆'}
                  </Text>
                ))}
              </Animated.View>
              <Text
                style={[styles.status, { color: labelColor(c, checkIn) }]}
                testID={`habit-label-${id}`}
              >
                {statusText(checkIn, isDue)}
              </Text>
            </View>
          </View>
          {burstId > 0 && !reduceMotion ? (
            <CardEffect key={burstId} checkIn={checkIn} colors={effectColors} />
          ) : null}
        </Pressable>
      </Animated.View>
    </ReanimatedSwipeable>
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

/** A ring around the icon that fills one step per day done this week, full once the goal is met. */
function ProgressRing(props: {
  id: string;
  color: string;
  track: string;
  done: number;
  goal: number;
  children: ReactNode;
}) {
  const styles = useStyles();
  const center = size.ring / 2;
  const r = center - size.ringStroke / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const fraction = props.goal > 0 ? Math.min(props.done / props.goal, 1) : 0;
  return (
    <View
      style={styles.ring}
      testID={`habit-ring-${props.id}`}
      accessibilityLabel={weekProgressText(props.done, props.goal)}
    >
      <Svg width={size.ring} height={size.ring} style={styles.ringSvg}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={withAlpha(props.track, tints.ringTrack)}
          strokeWidth={size.ringStroke}
        />
        {fraction > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={props.color}
            strokeWidth={size.ringStroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      {props.children}
    </View>
  );
}

/** One dot per weekly goal day. Filled = solid, empty = outline, so it reads by shape, not color alone. */
function ProgressDots(props: { id: string; color: string; done: number; goal: number }) {
  const styles = useStyles();
  return (
    <View style={styles.dots} testID={`habit-dots-${props.id}`}>
      {Array.from({ length: props.goal }, (_, i) => {
        const filled = i < props.done;
        return (
          <View
            key={i}
            testID={`habit-dot-${props.id}-${i + 1}${filled ? '-filled' : ''}`}
            style={[
              styles.dot,
              { borderColor: props.color },
              filled && { backgroundColor: props.color },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Each score level has its own label color, AA on the card (design-spendio.md). */
function labelColor(c: ThemeColors, checkIn: CheckIn | undefined): string {
  switch (checkIn) {
    case 'Started':
      return c.scoreStarted;
    case 'OnTrack':
      return c.scoreOnTrack;
    case 'NailedIt':
      return c.scoreNailedIt;
    default:
      return c.onSurfaceMuted;
  }
}

/** To do = outlined gray, Skip = filled gray: different by shape, not shade alone. */
function starColor(c: ThemeColors, checkIn: CheckIn | undefined, filled: boolean): string {
  if (checkIn === 'NotToday') return c.starNotToday;
  if (!filled) return c.starScoreNeeded;
  if (checkIn === 'Started') return c.scoreStartedStar;
  if (checkIn === 'OnTrack') return c.scoreOnTrackStar;
  return c.scoreNailedItStar;
}

function SwipeHint({ text, color, start }: { text: string; color: string; start?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.hint, { alignItems: start ? 'flex-start' : 'flex-end' }]}>
      <Text style={[styles.hintText, { color }]}>{text}</Text>
    </View>
  );
}

function useStyles() {
  const { colors, scheme } = useTheme();
  return useMemo(() => makeStyles(colors, scheme), [colors, scheme]);
}

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    swipeContainer: { borderRadius: radius.pill },
    card: {
      minHeight: MIN_TAP_SIZE + space.lg,
      borderRadius: radius.pill,
      // A hairline reads on the light sheet; dark needs a full point to hold the edge.
      borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
      borderColor: c.border,
      boxShadow: shadows.card,
      // design-spendio.html: 8 px around the ring, 18 px before the stars.
      paddingVertical: space.sm,
      paddingLeft: space.sm,
      paddingRight: space.lg + 2,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    pressed: { transform: [{ scale: 0.98 }] },
    ring: { width: size.ring, height: size.ring, alignItems: 'center', justifyContent: 'center' },
    ringSvg: { position: 'absolute' },
    icon: {
      width: size.icon,
      height: size.icon,
      borderRadius: size.icon / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconLetter: textStyle('habitName', '700'),
    textBlock: { flex: 1, gap: space.xs },
    name: { ...textStyle('habitName'), color: c.onSurface },
    dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    dot: {
      width: size.dot,
      height: size.dot,
      borderRadius: size.dot / 2,
      borderWidth: size.dotStroke,
    },
    right: { alignItems: 'flex-end', gap: space.xs },
    stars: { flexDirection: 'row', gap: 2 },
    star: { fontSize: size.star, lineHeight: size.star + space.xs },
    status: { ...textStyle('label'), minHeight: typography.label.lineHeight },
    hint: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
    hintText: textStyle('label'),
    dim: { ...StyleSheet.absoluteFill },
  });
