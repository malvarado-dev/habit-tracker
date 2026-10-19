// One habit card (design-spendio.md, Habit Card). A white pill: the weekly goal (progress
// ring around a letter icon, or progress dots under the name), the name, three stars, and
// one status slot. Tap cycles Started, On track, Nailed it, Not today, back to Score needed,
// so the same tap works as undo. Swipes are shortcuts, never the only way (T6 reworks them).
// Urbanist isn't loaded yet, so text uses the system font with the Spendio sizes and weights.

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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { habitCardSizes as size, shadows, tints, typography } from '@/design/tokens';
import type { ThemeColors } from '@/design/tokens';
import { MAX_STARS, STARS, type CheckIn, type Habit } from '@/rules/scoring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { cardAccessibilityLabel, iconLetter, statusText, weekProgressText } from './habitCardText';

/** The in-card effect for each score (SPEC-00). Not today has none; the card just dims. T9 replaces these. */
const EFFECTS: Partial<Record<CheckIn, string[]>> = {
  Started: ['✨', '✨', '✨'],
  OnTrack: ['👏', '👏', '✨', '👏'],
  NailedIt: ['🎆', '🎇', '🎆', '✨', '🎇', '🎆'],
};

export type GoalStyle = 'ring' | 'dots';

interface HabitCardProps {
  habit: Habit;
  checkIn: CheckIn | undefined;
  /** Due today: an unscored card says "Score needed". */
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
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => <SwipeHint text="Nailed it" color={c.scoreNailedIt} start />}
      renderRightActions={() => <SwipeHint text="Not today" color={c.onSurfaceMuted} />}
      onSwipeableWillOpen={handleSwipe}
      containerStyle={styles.swipeContainer}
    >
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
        accessibilityHint="Tap to change the score. Swipe right for Nailed it, left for Not today."
        accessibilityActions={[
          { name: 'nailedIt', label: 'Nailed it' },
          { name: 'notToday', label: 'Not today' },
        ]}
        onAccessibilityAction={(e) =>
          onSwipe(e.nativeEvent.actionName === 'nailedIt' ? 'NailedIt' : 'NotToday')
        }
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: checkIn === 'NotToday' ? c.surfaceDim : c.surface },
          pressed && styles.pressed,
        ]}
      >
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
            <View style={styles.stars} testID={`habit-stars-${id}`}>
              {Array.from({ length: MAX_STARS }, (_, i) => (
                <Text
                  key={i}
                  testID={`habit-star-${id}-${i + 1}`}
                  style={[styles.star, { color: starColor(c, checkIn, i < stars) }]}
                >
                  {i < stars || checkIn === 'NotToday' ? '★' : '☆'}
                </Text>
              ))}
            </View>
            <Text
              style={[styles.status, { color: labelColor(c, checkIn) }]}
              testID={`habit-label-${id}`}
            >
              {statusText(checkIn, isDue)}
            </Text>
          </View>
        </View>
        {burstId > 0 ? <CardEffect key={burstId} checkIn={checkIn} /> : null}
      </Pressable>
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

/** Score needed = outlined gray, Not today = filled gray: different by shape, not shade alone. */
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

/** A short burst of particles inside the card. Mounted fresh (new key) for each score change. */
function CardEffect({ checkIn }: { checkIn: CheckIn | undefined }) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const particles = checkIn ? EFFECTS[checkIn] : undefined;

  useEffect(() => {
    progress.value = withTiming(1, { duration: tuning.card.effectMs });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.8 }],
  }));

  if (!particles || reduceMotion) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.effect, style]} testID="card-effect">
      {particles.map((p, i) => (
        <Particle key={i} symbol={p} index={i} total={particles.length} />
      ))}
    </Animated.View>
  );
}

function Particle({ symbol, index, total }: { symbol: string; index: number; total: number }) {
  const styles = useStyles();
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.value = withSequence(
      withSpring(-tuning.card.particleLift - (index % 3) * tuning.card.particleLiftStagger),
      withTiming(-tuning.card.particleDriftTo, { duration: tuning.card.particleDriftMs }),
    );
  }, [lift, index]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const left = `${10 + (80 / Math.max(total - 1, 1)) * index}%` as const;
  return <Animated.Text style={[styles.particle, { left }, style]}>{symbol}</Animated.Text>;
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    swipeContainer: { borderRadius: radius.pill },
    card: {
      minHeight: MIN_TAP_SIZE + space.lg,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
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
    iconLetter: { ...typography.habitName, fontWeight: '700' },
    textBlock: { flex: 1, gap: space.xs },
    name: { ...typography.habitName, color: c.onSurface },
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
    status: { ...typography.label, minHeight: typography.label.lineHeight },
    hint: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
    hintText: { ...typography.label },
    effect: { ...StyleSheet.absoluteFill },
    particle: { position: 'absolute', top: '45%', fontSize: 22 },
  });
