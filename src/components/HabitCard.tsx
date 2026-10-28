// One habit card (PRD-15 Cards). A white pill with a letter icon and the habit's name.
// - Tap logs one time, with a quick press and a light haptic (P2-08a).
// - Habits done more than once a day show a segmented ring around the icon and a count ("3/8").
//   Gold logs fill first, then linked bad logs in slate (P2-08b); each segment fills clockwise
//   with the Activity Bar's easing. Once-a-day habits show no ring and no count.
// - Slide right (option D, P2-08b) reveals Skip, always first on the left, then the linked bad
//   habit as a dark chip with its count. Habits with no link show Skip only.
// - Long-press opens a menu with the same actions (Log [bad habit], Skip today, Edit habit), so
//   nothing is gesture-only.
// Reduced motion: no press scale, and segments fill without moving.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { noteCoinOrigin } from '@/features/coins/coinOrigin';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
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
import {
  badHabitColors as bad,
  habitCardSizes as size,
  history,
  cardEdge,
  tints,
} from '@/design/tokens';
import type { ThemeColors } from '@/design/tokens';
import { timesPerDay, type Habit } from '@/rules/habits';
import {
  arcLength,
  arcPath,
  ringFor,
  segmentArcs,
  segmentFills,
  type SegmentFill,
} from '@/rules/ring';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

import { iconLetter } from './habitCardText';
import { fillEasing, fillMs } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Floating over the room (#133). */
const floatShadow = { boxShadow: tuning.scene.floatShadow };

interface HabitCardProps {
  habit: Habit;
  /** Good logs so far on the card's day. */
  count: number;
  /** Linked bad logs so far (they fill slate segments after the gold ones). */
  slate?: number;
  /** The linked bad habit's name and today's count, if the habit has one. */
  linked?: { name: string; count: number };
  /** One tap: log one more time. */
  onLog: () => void;
  /** Slide or menu actions. Left out where they don't apply (History's Day screen). */
  onSkip?: () => void;
  onSlip?: () => void;
  onEdit?: () => void;
  /** A locked day in History (T16): dimmed, and taps are off. */
  locked?: boolean;
  /** History (P2-18a): taps on the card are off, not dimmed. */
  readOnly?: boolean;
  /** History frequency cards keep their History appearance but cycle on a card tap. */
  tapToCycle?: boolean;
  /** History edits (P2-18b): controls drawn at the right end of the card. */
  trailing?: ReactNode;
  /** Home without the sheet (#133): the card floats over the room, so it gets a stronger shadow. */
  floating?: boolean;
}

export function HabitCard(props: HabitCardProps) {
  const { habit, count, slate = 0, linked, onLog, locked = false, readOnly = false } = props;
  const off = locked || (readOnly && !props.tapToCycle);
  const styles = useStyles();
  const { colors: c } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const swipe = useRef<SwipeableMethods>(null);
  // Letting go after a slide can also arrive as a press (seen on the web with a mouse), which
  // would log the habit by accident. Taps are ignored for a moment after a slide starts.
  const slidAt = useRef(0);
  const [menu, setMenu] = useState(false);
  const habitColor = c[habit.color];
  const times = timesPerDay(habit);
  // History keeps its ring and crosses out completed names. Today removes finished cards.
  const ring = ringFor(times, count, slate) ?? (readOnly ? onceRing(count, slate) : null);
  const completed = readOnly && count + slate >= times;
  const onceText = readOnly && times <= 1 && count === 0 ? linked?.name : undefined;
  const name = habit.name.trim() || 'Untitled habit';
  const id = habit.id;
  const canSlide = !off && !!props.onSkip;

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const buzz = (finishes: boolean) =>
    (finishes
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ).catch(() => {});

  const log = () => {
    if (off) return;
    if (Date.now() - slidAt.current < tuning.card.ignoreTapAfterSlideMs) return;
    // Haptics never block the tap; a phone or browser without them just stays quiet.
    buzz(count + slate + 1 >= times);
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

  // Flying coins start where the finger is (P2-08c).
  const coinOrigin = (e: GestureResponderEvent) =>
    noteCoinOrigin(e.nativeEvent.pageX, e.nativeEvent.pageY);

  // Each action closes the slide (and the menu) first, then runs.
  const act = (run?: () => void) => () => {
    swipe.current?.close();
    setMenu(false);
    run?.();
  };
  const slip = act(() => {
    buzz(count + slate + 1 >= times);
    props.onSlip?.();
  });
  const skip = act(props.onSkip);
  const edit = act(props.onEdit);

  const card = (
    <Animated.View style={[scaleStyle, locked && { opacity: history.lockedCardOpacity }]}>
      <Pressable
        onPressIn={coinOrigin}
        onPress={log}
        onLongPress={canSlide ? () => setMenu(true) : undefined}
        delayLongPress={tuning.card.longPressMs}
        // A read-only History card still holds its own − / + and Undo buttons, so only a locked
        // day turns the whole card off; log() ignores taps on a read-only card.
        disabled={locked}
        accessibilityState={{ disabled: off }}
        testID={`habit-card-${id}`}
        accessibilityRole={readOnly && !props.tapToCycle ? undefined : 'button'}
        // No custom label: the spoken name is the card's visible text (name and count), so voice
        // control users can say what they see (#113, WCAG 2.5.3). The letter icon is hidden.
        accessibilityHint={
          locked
            ? 'This day is locked.'
            : readOnly
              ? props.tapToCycle
                ? 'Tap to add one. When full, tap to reset good logs. Linked slips stay.'
                : undefined
              : canSlide
                ? 'Tap to log one time. Long-press for more.'
                : 'Tap to log one time.'
        }
        accessibilityActions={
          canSlide
            ? [
                ...(linked ? [{ name: 'slip', label: `Log ${linked.name}` }] : []),
                { name: 'skip', label: 'Skip today' },
              ]
            : []
        }
        onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'slip' ? slip() : skip())}
        style={[styles.card, { backgroundColor: c.surface }, props.floating && floatShadow]}
      >
        <View style={styles.row}>
          {ring ? (
            <SegmentRing id={id} fills={segmentFills(ring)} filled={ring.filled}>
              <LetterIcon id={id} name={name} color={habitColor} />
            </SegmentRing>
          ) : (
            <View style={styles.ringSlot}>
              <LetterIcon id={id} name={name} color={habitColor} />
            </View>
          )}

          <Text
            style={[styles.name, completed && styles.completedName]}
            numberOfLines={1}
            testID={`habit-name-${id}`}
            accessibilityLabel={
              readOnly ? `${name}, ${completed ? 'completed' : 'in progress'}` : undefined
            }
          >
            {name}
          </Text>

          {onceText ? (
            <Text
              style={[styles.count, { color: count > 0 ? tuning.ring.gold : tuning.ring.slate }]}
              testID={`habit-count-${id}`}
            >
              {onceText}
            </Text>
          ) : ring && times > 1 ? (
            <Text style={styles.count} testID={`habit-count-${id}`}>
              {ring.label}
            </Text>
          ) : null}
          {props.trailing}
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <>
      {canSlide ? (
        <ReanimatedSwipeable
          ref={swipe}
          friction={1.5}
          dragOffsetFromLeft={tuning.card.slideStartOffset}
          onSwipeableOpenStartDrag={() => {
            slidAt.current = Date.now();
          }}
          onSwipeableWillOpen={() => {
            slidAt.current = Date.now();
          }}
          overshootLeft={false}
          renderLeftActions={() => (
            <View style={styles.actions} testID={`habit-actions-${id}`}>
              <Pressable
                onPress={skip}
                style={styles.skip}
                testID={`habit-skip-${id}`}
                accessibilityRole="button"
                accessibilityLabel={`Skip ${name} today`}
              >
                <Text style={styles.skipArrow}>→</Text>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              {linked ? (
                <Pressable
                  onPressIn={coinOrigin}
                  onPress={slip}
                  style={styles.chip}
                  testID={`habit-slip-${id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${linked.name}, ${linked.count} today`}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {linked.name}
                  </Text>
                  <View style={[styles.badge, linked.count > 0 ? styles.badgeOn : styles.badgeOff]}>
                    <Text style={[styles.badgeText, linked.count > 0 && styles.badgeTextOn]}>
                      {linked.count}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          )}
          containerStyle={styles.swipeContainer}
        >
          {card}
        </ReanimatedSwipeable>
      ) : (
        card
      )}
      {menu ? (
        <CardMenu habitName={name} onClose={() => setMenu(false)}>
          {linked ? (
            <MenuItem label={`Log ${linked.name}`} onPress={slip} testID="card-menu-slip" />
          ) : null}
          <MenuItem label="Skip today" onPress={skip} testID="card-menu-skip" />
          {props.onEdit ? (
            <MenuItem label="Edit habit" onPress={edit} testID="card-menu-edit" />
          ) : null}
        </CardMenu>
      ) : null}
    </>
  );
}

/** The long-press menu: a small card over a see-through shade. Tap outside to close. */
function CardMenu(props: { habitName: string; onClose: () => void; children: ReactNode }) {
  const styles = useStyles();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={props.onClose}>
      <Pressable
        style={styles.shade}
        onPress={props.onClose}
        testID="card-menu-backdrop"
        accessibilityLabel="Close"
      />
      <View style={styles.menuWrap} pointerEvents="box-none">
        <View style={styles.menu} testID="card-menu" accessibilityViewIsModal>
          <Text style={styles.menuTitle} accessibilityRole="header">
            {props.habitName}
          </Text>
          {props.children}
        </View>
      </View>
    </Modal>
  );
}

function MenuItem(props: { label: string; onPress: () => void; testID: string }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
      testID={props.testID}
      accessibilityRole="button"
    >
      <Text style={styles.menuItemText}>{props.label}</Text>
    </Pressable>
  );
}

/** The letter placeholder in a tinted circle, until the icon sheet. */
/** A once-a-day habit's ring in History: one segment, gold if done, slate if slipped. */
function onceRing(count: number, slate: number) {
  const gold = Math.min(count, 1);
  const slateFill = gold ? 0 : Math.min(slate, 1);
  const filled = gold + slateFill;
  return { segments: 1, filled, gold, slate: slateFill, label: `${filled}/1` };
}

function LetterIcon({ id, name, color }: { id: string; name: string; color: string }) {
  const styles = useStyles();
  return (
    <View
      style={[styles.icon, { backgroundColor: withAlpha(color, tints.icon) }]}
      testID={`habit-icon-${id}`}
      // Decoration: the card's spoken name already says the habit (#113).
      aria-hidden
    >
      <Text style={[styles.iconLetter, { color }]}>{iconLetter(name)}</Text>
    </View>
  );
}

/**
 * One segment per time a day around the icon: gold, then slate, then empty, clockwise from the
 * top. Hidden from screen readers: the card's visible count says the same (#113). The label stays
 * so tests can read the ring.
 */
function SegmentRing(props: {
  id: string;
  fills: SegmentFill[];
  filled: number;
  children: ReactNode;
}) {
  const styles = useStyles();
  const { ring: r } = tuning;
  const center = size.ring / 2;
  const radiusPx = center - r.stroke / 2 - 1;
  const arcs = segmentArcs(props.fills.length, r.gapDegrees);
  return (
    <View
      style={styles.ringSlot}
      testID={`habit-ring-${props.id}`}
      aria-hidden
      accessibilityLabel={`${props.filled} of ${props.fills.length} done today`}
    >
      <Svg width={size.ring} height={size.ring} style={styles.ringSvg}>
        {arcs.map((arc, i) => (
          <RingSegment
            key={i}
            d={arcPath(center, radiusPx, arc)}
            length={arcLength(radiusPx, arc)}
            fill={props.fills[i] ?? 'empty'}
          />
        ))}
      </Svg>
      {props.children}
    </View>
  );
}

/** A track arc with a colored arc over it that draws in along the arc when the segment fills. */
function RingSegment({ d, length, fill }: { d: string; length: number; fill: SegmentFill }) {
  const reduceMotion = useReducedMotion();
  const { ring: r } = tuning;
  const filled = fill !== 'empty';
  const progress = useSharedValue(filled ? 1 : 0);
  // Keep the last fill color while a segment empties, so Undo doesn't flash it gold.
  const [color, setColor] = useState(fill === 'slate' ? r.slate : r.gold);
  if (filled && color !== (fill === 'slate' ? r.slate : r.gold)) {
    setColor(fill === 'slate' ? r.slate : r.gold);
  }

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
        stroke={color}
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

const BADGE = 22;

const makeStyles = (c: ThemeColors, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    swipeContainer: { borderRadius: radius.pill, backgroundColor: c.surfaceDim },
    card: {
      minHeight: MIN_TAP_SIZE + space.lg,
      borderRadius: radius.pill,
      ...cardEdge(scheme, c.border),
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
    name: { ...textStyle('habitName'), color: c.onSurface, flex: 1, minWidth: 0 },
    // Let Android, iOS and web place the strike using their text/font metrics.
    completedName: { textDecorationLine: 'line-through' },
    count: { ...textStyle('label', '700'), color: c.onSurfaceMuted },
    // Option D: Skip circle first, then the dark bad habit chip.
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingHorizontal: space.sm,
    },
    skip: {
      width: MIN_TAP_SIZE + space.md,
      height: MIN_TAP_SIZE + space.md,
      borderRadius: (MIN_TAP_SIZE + space.md) / 2,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipArrow: { ...textStyle('label'), color: c.onSurface },
    skipText: { ...textStyle('caption'), color: c.onSurface },
    chip: {
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingLeft: space.lg,
      paddingRight: space.sm,
      borderRadius: radius.pill,
      backgroundColor: bad.chip,
    },
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
    shade: { ...StyleSheet.absoluteFill, backgroundColor: withAlpha(c.inverse, 0.35) },
    menuWrap: { ...StyleSheet.absoluteFill, justifyContent: 'center', padding: space.xl },
    menu: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: space.sm,
      gap: space.xs,
    },
    menuTitle: {
      ...textStyle('label'),
      color: c.onSurfaceMuted,
      paddingHorizontal: space.md,
      paddingTop: space.sm,
      paddingBottom: space.xs,
    },
    menuItem: {
      minHeight: MIN_TAP_SIZE,
      justifyContent: 'center',
      paddingHorizontal: space.md,
      borderRadius: radius.md,
    },
    menuItemText: { ...textStyle('body', '600'), color: c.onSurface },
    pressed: { backgroundColor: c.surfaceDim },
  });
