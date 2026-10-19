// Energy bar at the top of the habit sheet: today's score, with no text on screen (SPEC-00).
// Every star moves the lemon fill. A checkered flag stands on the bar at the S cutoff (90%),
// like a finish line; 100% means 3 stars on everything that counts today (decided 2026-10-18).
// Crossing the flag waves it and sweeps a shimmer across the fill; reaching 100% adds a brief
// brighten and sparkles off the end. Reduced motion: only the brighten.

import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { useTheme } from '@/design/theme/ThemeProvider';

import { seeded } from './cardEffectLayout';
import {
  clampEnergy,
  energyLabel,
  energyMilestone,
  flagPosition,
  type EnergyMilestone,
} from './energyBarText';

type Props = {
  /** 0 to 1, from getEnergy. */
  energy: number;
  earnedStars: number;
  possibleStars: number;
  isRestDay: boolean;
};

export function EnergyBar({ energy, earnedStars, possibleStars, isRestDay }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const fraction = clampEnergy(energy);
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
  const tilt = useSharedValue(0);
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
    const d = cel.flagTiltDegrees;
    const w = cel.flagWaveMs;
    tilt.value = withDelay(
      wait,
      withSequence(
        withTiming(-d, { duration: w }),
        withTiming(d, { duration: w * 2 }),
        withTiming(-d / 2, { duration: w * 2 }),
        withTiming(0, { duration: w }),
      ),
    );
    shimmer.value = 0;
    shimmer.value = withDelay(wait, withTiming(1, { duration: cel.shimmerMs }));
    setBurst((b) => ({ id: (b?.id ?? 0) + 1, kind }));
  }, [fraction, isRestDay, reduceMotion, tilt, shimmer, flash, cel]);

  const flagStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value > 0 && shimmer.value < 1 ? cel.shimmerOpacity : 0,
    transform: [
      { translateX: -cel.shimmerWidth + (fillWidth.value + cel.shimmerWidth) * shimmer.value },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  // The pole's center sits on the S cutoff of the fill area.
  const flagLeft = TRACK_PADDING + innerWidth * flagPosition() - POLE_WIDTH / 2;

  return (
    <View
      testID="energy-bar"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={energyLabel(earnedStars, possibleStars, isRestDay)}
      accessibilityValue={isRestDay ? undefined : { min: 0, max: possibleStars, now: earnedStars }}
      style={styles.wrap}
    >
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
      </View>
      {trackWidth > 0 ? (
        <Animated.View style={[styles.flag, { left: flagLeft }, flagStyle]}>
          {/* onSurface and the sheet color: dark flag on the light sheet, light flag on the dark sheet. */}
          <CheckeredFlag light={colors.surfaceSheet} dark={colors.onSurface} />
        </Animated.View>
      ) : null}
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
  );
}

/** Pole plus a 4 by 3 checker, drawn in the card white and the inverse dark so it reads on both sheets. */
function CheckeredFlag({ light, dark }: { light: string; dark: string }) {
  const cols = 4;
  const rows = 3;
  const cell = 3;
  const left = 2;
  const squares = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      squares.push(
        <Rect
          key={`${r}-${c}`}
          x={left + c * cell}
          y={1 + r * cell}
          width={cell}
          height={cell}
          fill={(r + c) % 2 === 0 ? dark : light}
        />,
      );
    }
  }
  return (
    <View testID="energy-flag" importantForAccessibility="no-hide-descendants">
      <Svg width={FLAG_SIZE} height={FLAG_SIZE} viewBox="0 0 18 18" accessible={false}>
        <Rect x={0} y={0} width={2} height={18} rx={1} fill={dark} />
        <Rect
          x={left - 0.5}
          y={0.5}
          width={cols * cell + 1}
          height={rows * cell + 1}
          fill={light}
          stroke={dark}
          strokeWidth={1}
        />
        {squares}
      </Svg>
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
  const top = FLAG_SIZE + TRACK_HEIGHT / 2 - p.size / 2;
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

// energy-bar component in design-system.md: 14 pt dark pill, 3 pt padding, 8 pt fill,
// and an 18 pt checkered flag standing on the bar at the S cutoff.
const TRACK_PADDING = 3;
const TRACK_HEIGHT = 14;
const FLAG_SIZE = 18;
const POLE_WIDTH = 2;

const styles = StyleSheet.create({
  wrap: { paddingTop: FLAG_SIZE },
  track: { height: TRACK_HEIGHT, padding: TRACK_PADDING, borderRadius: 9999 },
  fill: { height: 8, borderRadius: 9999, overflow: 'hidden' },
  flag: { position: 'absolute', bottom: TRACK_HEIGHT, transformOrigin: 'bottom left' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 9999 },
  flash: { ...StyleSheet.absoluteFill },
  sparkles: { ...StyleSheet.absoluteFill },
  spark: { position: 'absolute' },
});
