// One habit card. Tap to cycle the score (Started, On track, Nailed it, Not today, Score needed).
// Full swipe right = Nailed it, full swipe left = Not today. Tapping reaches every score,
// so the swipes are shortcuts, never the only way (accessibility).

import { useEffect, useMemo, useRef, useState } from 'react';
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

import { MAX_STARS, STARS, type CheckIn, type Habit } from '@/rules/scoring';
import { font, MIN_TAP_SIZE, radius, space } from '@/theme';
import { tuning } from '@/config/tuning';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';

const LABELS: Record<CheckIn, string> = {
  NotToday: 'Not today',
  Started: 'Started',
  OnTrack: 'On track',
  NailedIt: 'Nailed it',
};

/** The in-card effect for each score (SPEC-00). Not today has none; the card just dims. */
const EFFECTS: Partial<Record<CheckIn, string[]>> = {
  Started: ['✨', '✨', '✨'],
  OnTrack: ['👏', '👏', '✨', '👏'],
  NailedIt: ['🎆', '🎇', '🎆', '✨', '🎇', '🎆'],
};

/** How far the card must travel before a swipe counts. "Full swipe" = deliberate. */
const SWIPE_THRESHOLD = tuning.card.swipeThreshold;

interface HabitCardProps {
  habit: Habit;
  checkIn: CheckIn | undefined;
  onTap: () => void;
  onSwipe: (checkIn: CheckIn) => void;
}

export function HabitCard({ habit, checkIn, onTap, onSwipe }: HabitCardProps) {
  const styles = useStyles();
  const { colors: c } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  // Play the in-card effect only when the score changes, not for scores already saved.
  const [shownCheckIn, setShownCheckIn] = useState(checkIn);
  const [burstId, setBurstId] = useState(0);
  if (shownCheckIn !== checkIn) {
    setShownCheckIn(checkIn);
    setBurstId((id) => id + 1);
  }
  const stars = checkIn ? STARS[checkIn] : 0;
  const label = checkIn ? LABELS[checkIn] : 'Score needed';
  const name = habit.name.trim() || 'Untitled habit';

  const handleSwipe = (direction: SwipeDirection.LEFT | SwipeDirection.RIGHT) => {
    onSwipe(direction === SwipeDirection.RIGHT ? 'NailedIt' : 'NotToday');
    swipeRef.current?.close();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={1.5}
      leftThreshold={SWIPE_THRESHOLD}
      rightThreshold={SWIPE_THRESHOLD}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <SwipeHint text="Nailed it ★★★" align="flex-start" color={c.scoreNailedIt} />
      )}
      renderRightActions={() => (
        <SwipeHint text="Not today" align="flex-end" color={c.onSurfaceMuted} />
      )}
      onSwipeableWillOpen={handleSwipe}
      containerStyle={styles.swipeContainer}
    >
      <Pressable
        onPress={onTap}
        testID={`habit-card-${habit.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${checkIn ? `${label}, ${stars} of ${MAX_STARS} stars` : 'not checked in yet'}`}
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
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text
            style={[styles.label, { color: labelColor(c, checkIn) }]}
            testID={`habit-label-${habit.id}`}
          >
            {label}
          </Text>
        </View>
        <View style={styles.stars} importantForAccessibility="no-hide-descendants">
          {Array.from({ length: MAX_STARS }, (_, i) => (
            <Text key={i} style={[styles.star, { color: starColor(c, checkIn, i < stars) }]}>
              {i < stars || checkIn === 'NotToday' ? '★' : '☆'}
            </Text>
          ))}
        </View>
        {burstId > 0 ? <CardEffect key={burstId} checkIn={checkIn} /> : null}
      </Pressable>
    </ReanimatedSwipeable>
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

function SwipeHint({
  text,
  align,
  color,
}: {
  text: string;
  align: 'flex-start' | 'flex-end';
  color: string;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.hint, { alignItems: align }]}>
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
    swipeContainer: { borderRadius: radius.md },
    card: {
      minHeight: MIN_TAP_SIZE + space.xl,
      borderRadius: radius.md,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
    },
    pressed: { transform: [{ scale: 0.98 }] },
    textBlock: { flex: 1 },
    name: { color: c.onSurface, fontSize: font.body, fontWeight: '700' },
    label: { color: c.onSurfaceMuted, fontSize: font.small, marginTop: 2 },
    stars: { flexDirection: 'row', gap: 2 },
    star: { fontSize: 26 },
    hint: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
    hintText: { fontWeight: '800', fontSize: font.body },
    effect: { ...StyleSheet.absoluteFill },
    particle: { position: 'absolute', top: '45%', fontSize: 22 },
  });
