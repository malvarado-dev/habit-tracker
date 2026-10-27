// The Activity Bar (PRD-14): a dark pill with a lemon fill and
// no visible notches or icons (#137). The fill is counted logs against today's target
// (rules/activityBar.ts), so every log moves it the same amount. Reaching full plays the full-bar
// celebration: a shimmer sweeps the fill, it brightens, and sparkles pop off the end. The Day
// screen shows its date and a percent row above the bar. Reduced motion: only the brighten.

import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { energyBar as bar } from '@/design/tokens';

import { momentCaption, pickMoment } from '@/rules/payoff';
import { requestPetMoment } from '@/scene/petMoments';

import { activityBarLabel, clampFill, justFilled, seeded } from './activityBarText';
import { MomentCaption } from './ActivityPayoff';
import { fillEasing, fillMs } from './motion';

type Props = {
  /** 0 to 1, from getActivityBar. */
  fill: number;
  /** Counted logs and the target, for screen readers and the Day screen's count. */
  logs: number;
  target: number;
  isRestDay: boolean;
  /** The Day screen's date label ("Thu, Oct 15"). Today leaves it out. */
  label?: string;
  /** Enables Today's full-bar pet moment and caption. */
  petMoments?: boolean;
  /** Habits finished today, for the full-bar caption (P2-14). Today only. */
  finished?: number;
};

export function ActivityBar(props: Props) {
  const { fill, logs, target, isRestDay, label, petMoments = false, finished = 0 } = props;
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const fraction = clampFill(fill);
  const [trackWidth, setTrackWidth] = useState(0);
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    const width = fraction * innerWidth;
    fillWidth.value =
      reduceMotion || innerWidth === 0
        ? width
        : withTiming(width, { duration: fillMs, easing: fillEasing });
  }, [fraction, innerWidth, reduceMotion, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  // Full-bar celebration: only on an upward move to full, starting once the fill arrives.
  // `fills` counts each time the bar fills, worked out while rendering so the effect below only
  // starts animations.
  const cel = tuning.energy.celebrate;
  const [previous, setPrevious] = useState(fraction);
  const [fills, setFills] = useState(0);
  if (previous !== fraction) {
    setPrevious(fraction);
    if (justFilled(previous, fraction, isRestDay)) setFills((n) => n + 1);
  }

  // A full bar on Today plays one pet moment, with a caption (P2-14). Visual only.
  useEffect(() => {
    if (fills === 0 || !petMoments) return;
    const kind = pickMoment(Math.random);
    requestPetMoment({ kind, caption: momentCaption(kind, finished) });
    // Only a new fill fires a moment; `finished` is read at that time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fills, petMoments]);

  const shimmer = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (fills === 0) return;
    const wait = reduceMotion ? 0 : tuning.energy.fillMs;
    flash.value = withDelay(
      wait,
      withSequence(
        withTiming(cel.flashOpacity, { duration: cel.flashMs / 2 }),
        withTiming(0, { duration: cel.flashMs / 2 }),
      ),
    );
    if (reduceMotion) return;
    shimmer.value = 0;
    shimmer.value = withDelay(wait, withTiming(1, { duration: cel.shimmerMs }));
  }, [fills, reduceMotion, shimmer, flash, cel]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value > 0 && shimmer.value < 1 ? cel.shimmerOpacity : 0,
    transform: [
      { translateX: -cel.shimmerWidth + (fillWidth.value + cel.shimmerWidth) * shimmer.value },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const percent = Math.round(fraction * 100);

  return (
    <View
      testID="activity-bar"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={activityBarLabel(
        logs,
        target,
        isRestDay,
        label && label !== 'Today' ? `on ${label}` : 'today',
      )}
      accessibilityValue={isRestDay ? undefined : { min: 0, max: 100, now: percent }}
      style={styles.wrap}
    >
      {petMoments ? null : (
        <View style={styles.labelRow} importantForAccessibility="no-hide-descendants">
          <Text style={[styles.labelText, { color: colors.onSurface }]} testID="activity-bar-label">
            {label ?? ''}
          </Text>
          <Text style={[styles.labelText, { color: colors.onSurface }]} testID="activity-bar-count">
            {isRestDay ? 'Rest day' : `${Math.min(logs, target)}/${target}`}
          </Text>
        </View>
      )}
      <View>
        {petMoments ? <MomentCaption /> : null}
        <View onLayout={onTrackLayout} style={[styles.track, { backgroundColor: colors.track }]}>
          <Animated.View
            testID="activity-bar-fill"
            style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                { width: cel.shimmerWidth, backgroundColor: colors.onInverse },
                shimmerStyle,
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.flash, { backgroundColor: colors.onInverse }, flashStyle]}
            />
          </Animated.View>
        </View>
        {fills > 0 && !reduceMotion && trackWidth > 0 ? (
          <EndSparkles
            key={fills}
            seed={fills}
            x={TRACK_PADDING + innerWidth}
            color={colors.primary}
            outline={colors.onSurface}
            delayMs={tuning.energy.fillMs}
          />
        ) : null}
      </View>
    </View>
  );
}

/** 100% only: a few small sparkles pop up off the end of the bar and fade. */
function EndSparkles(props: {
  seed: number;
  x: number;
  color: string;
  outline: string;
  delayMs: number;
}) {
  const cel = tuning.energy.celebrate;
  const rand = seeded(props.seed * 97 + 13);
  const sparks = Array.from({ length: cel.sparkleCount }, (_, i) => {
    const spread = 140 / Math.max(cel.sparkleCount - 1, 1);
    const angle = (-160 + spread * i + (rand() - 0.5) * 16) * (Math.PI / 180);
    const [dMin, dMax] = cel.sparkleDistance;
    const [sMin, sMax] = cel.sparkleSize;
    return {
      dx: Math.cos(angle) * (dMin + (dMax - dMin) * rand()),
      dy: Math.sin(angle) * (dMin + (dMax - dMin) * rand()),
      size: sMin + (sMax - sMin) * rand(),
    };
  });
  return (
    <View pointerEvents="none" style={styles.sparkles} testID="activity-bar-sparkles">
      {sparks.map((sp, i) => (
        <Spark
          key={i}
          {...sp}
          x={props.x}
          color={props.color}
          outline={props.outline}
          delayMs={props.delayMs}
        />
      ))}
    </View>
  );
}

function Spark(p: {
  dx: number;
  dy: number;
  size: number;
  x: number;
  color: string;
  outline: string;
  delayMs: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      p.delayMs,
      withTiming(1, {
        duration: tuning.energy.celebrate.sparkleMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [t, p.delayMs]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : t.value < 0.6 ? 1 : (1 - t.value) / 0.4,
    transform: [
      { translateX: p.dx * t.value },
      { translateY: p.dy * t.value },
      { scale: 0.4 + Math.min(t.value * 2, 1) * 0.6 },
    ],
  }));
  const top = bar.trackHeight / 2 - p.size / 2;
  return (
    <Animated.View style={[styles.spark, { left: p.x - p.size / 2, top }, style]}>
      <Svg width={p.size} height={p.size} viewBox="0 0 24 24">
        <Path
          d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
          fill={p.color}
          stroke={p.outline}
          strokeWidth={1.5}
        />
      </Svg>
    </Animated.View>
  );
}

// energy-bar component in design-system.md: 14 pt dark pill, 3 pt padding, 8 pt fill; no visible markers.
const TRACK_PADDING = bar.trackPadding;

const styles = StyleSheet.create({
  wrap: { gap: bar.labelGap },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  labelText: { ...textStyle('habitName', '700') },
  track: { height: bar.trackHeight, padding: bar.trackPadding, borderRadius: 9999 },
  fill: { height: bar.fillHeight, borderRadius: 9999, overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 9999 },
  flash: { ...StyleSheet.absoluteFill },
  sparkles: { ...StyleSheet.absoluteFill },
  spark: { position: 'absolute' },
});
