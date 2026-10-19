// Energy bar at the top of the habit sheet (SPEC-00, T18): "Today" and a percentage over a dark
// pill with a lemon fill. Three plain ticks mark the B, A, and S cutoffs and darken once the fill
// passes them. The fill is today's share of what counts (rules/energy.ts), so every counted star
// moves it the same amount. Crossing the top tick sweeps a shimmer across the fill; reaching 100%
// adds a brief brighten and sparkles off the end. A goal-met glow pulses around the track when
// `glowKey` changes. Reduced motion: only the brighten, and the glow without motion.

import { useEffect, useRef, useState } from 'react';
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

import { seeded } from './cardEffectLayout';
import {
  clampEnergy,
  energyLabel,
  energyMilestone,
  percentText,
  tickPositions,
  type EnergyMilestone,
} from './energyBarText';

type Props = {
  /** 0 to 1, from getEnergyBar. */
  fill: number;
  isRestDay: boolean;
  /** "Today" on Today. The Day screen leaves it out, since its title is the date. */
  label?: string;
  /** Changes each time Weekly goal met plays, to pulse the glow. */
  glowKey?: number;
};

export function EnergyBar({ fill, isRestDay, label, glowKey = 0 }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const fraction = clampEnergy(fill);
  const [trackWidth, setTrackWidth] = useState(0);
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    const target = fraction * innerWidth;
    fillWidth.value =
      reduceMotion || innerWidth === 0
        ? target
        : withTiming(target, { duration: tuning.energy.fillMs, easing: Easing.out(Easing.cubic) });
  }, [fraction, innerWidth, reduceMotion, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  // Celebrations: only on an upward crossing, starting once the fill arrives.
  const cel = tuning.energy.celebrate;
  const previous = useRef(fraction);
  const [burst, setBurst] = useState<{ id: number; kind: EnergyMilestone } | null>(null);
  const glow = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    const kind = energyMilestone(previous.current, fraction, isRestDay);
    previous.current = fraction;
    if (!kind) return;
    const wait = reduceMotion ? 0 : tuning.energy.fillMs;
    if (kind === 'full') {
      flash.value = withDelay(
        wait,
        withSequence(
          withTiming(cel.flashOpacity, { duration: cel.flashMs / 2 }),
          withTiming(0, { duration: cel.flashMs / 2 }),
        ),
      );
    }
    if (reduceMotion) return;
    shimmer.value = 0;
    shimmer.value = withDelay(wait, withTiming(1, { duration: cel.shimmerMs }));
    setBurst((b) => ({ id: (b?.id ?? 0) + 1, kind }));
  }, [fraction, isRestDay, reduceMotion, shimmer, flash, cel]);

  // Weekly goal met: a soft glow around the track. Reduced motion holds it, then drops it, with no fade.
  const gm = tuning.energy.goalMet;
  useEffect(() => {
    if (glowKey === 0) return;
    if (reduceMotion) {
      glow.value = gm.glowOpacity;
      const timer = setTimeout(() => {
        glow.value = 0;
      }, gm.glowMs);
      return () => clearTimeout(timer);
    }
    glow.value = withSequence(
      withTiming(gm.glowOpacity, { duration: gm.glowMs * 0.3 }),
      withTiming(0, { duration: gm.glowMs * 0.7 }),
    );
  }, [glowKey, reduceMotion, glow, gm]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

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
      testID="energy-bar"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={energyLabel(fraction, isRestDay)}
      accessibilityValue={isRestDay ? undefined : { min: 0, max: 100, now: percent }}
      style={styles.wrap}
    >
      <View style={styles.labelRow} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.labelText, { color: colors.onSurface }]} testID="energy-label">
          {label ?? ''}
        </Text>
        <Text style={[styles.labelText, { color: colors.onSurface }]} testID="energy-percent">
          {percentText(fraction)}
        </Text>
      </View>
      <View>
        <Animated.View
          pointerEvents="none"
          testID="energy-glow"
          style={[styles.glow, { backgroundColor: colors.primary }, glowStyle]}
        />
        <View onLayout={onTrackLayout} style={[styles.track, { backgroundColor: colors.track }]}>
          <Animated.View
            testID="energy-fill"
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
          {trackWidth > 0
            ? tickPositions().map((at, i, all) => {
                const top = i === all.length - 1;
                const passed = fraction >= at;
                return (
                  <View
                    key={at}
                    pointerEvents="none"
                    testID={`energy-tick-${Math.round(at * 100)}`}
                    style={[
                      styles.tick,
                      {
                        left: bar.trackPadding + innerWidth * at - bar.tickWidth / 2,
                        top: top ? -bar.topTickOverhang : bar.trackPadding,
                        bottom: top ? -bar.topTickOverhang : bar.trackPadding,
                        // Light on the dark track until the fill passes it, then dark on the lemon fill.
                        backgroundColor: passed ? colors.onPrimary : colors.onInverse,
                      },
                    ]}
                  />
                );
              })
            : null}
        </View>
        {burst?.kind === 'full' && trackWidth > 0 ? (
          <EndSparkles
            key={burst.id}
            seed={burst.id}
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
    <View pointerEvents="none" style={styles.sparkles} testID="energy-sparkles">
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

// energy-bar component in design-system.md: 14 pt dark pill, 3 pt padding, 8 pt fill, ticks at the cutoffs.
const TRACK_PADDING = bar.trackPadding;

const styles = StyleSheet.create({
  wrap: { gap: bar.labelGap },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  labelText: { ...textStyle('habitName', '700') },
  track: { height: bar.trackHeight, padding: bar.trackPadding, borderRadius: 9999 },
  fill: { height: bar.fillHeight, borderRadius: 9999, overflow: 'hidden' },
  tick: { position: 'absolute', width: bar.tickWidth, borderRadius: 9999 },
  glow: {
    position: 'absolute',
    top: -bar.glowSpread,
    bottom: -bar.glowSpread,
    left: -bar.glowSpread,
    right: -bar.glowSpread,
    borderRadius: 9999,
  },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 9999 },
  flash: { ...StyleSheet.absoluteFill },
  sparkles: { ...StyleSheet.absoluteFill },
  spark: { position: 'absolute' },
});
