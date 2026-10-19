// The Background (background.md): the full-screen sky behind the critter. It changes only
// with time of day and the live rank, never with the theme. Placeholder art until the
// scene is designed. The moon is a crescent so it never reads as the sun.
// Rank moment (T15): once a day is finished, a one-time effect that grows with the rank:
// C sun pulse, B plus twinkling sparkles, A plus a sky flash and a sparkle burst, S plus a
// ray flare and a sparkle shower. The flash brightens the sky only, behind the critter.
// It never takes touches. Reduced motion: brightness only, no movement.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { withAlpha } from '@/design/theme/theme';
import { background as sky, skyGlow, todayLayout } from '@/design/tokens';
import type { Rank } from '@/rules/rank';
import type { SkyLevel, SkyTime } from '@/rules/sky';

import type { Moment } from './Critter';
import { crescent } from './skyShapes';

const GRADIENTS: Record<SkyTime, string[]> = {
  day: [sky.dayTop, sky.dayMid, sky.dayBottom],
  dusk: [sky.duskTop, sky.duskMid, sky.duskLow, sky.duskHorizon],
  night: [sky.nightTop, sky.nightMid, sky.nightLow, sky.nightHorizon],
};

const BODY: Record<SkyTime, string> = { day: sky.daySun, dusk: sky.duskMoon, night: sky.nightMoon };

/** Stars and clouds stay in the top third, never behind the critter's face (background.md). */
const STARS = [
  [0.12, 0.08],
  [0.3, 0.16],
  [0.48, 0.06],
  [0.2, 0.26],
  [0.62, 0.2],
  [0.08, 0.3],
] as const;
const CLOUDS = [
  [0.1, 0.12, 0.22],
  [0.42, 0.22, 0.16],
] as const;
const RAY_COUNT = 8;

export function Background({
  time,
  level,
  moment = null,
}: {
  time: SkyTime;
  level: SkyLevel;
  moment?: Moment | null;
}) {
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);
  const flash = useSharedValue(0);
  const pulse = useSharedValue(1);
  const flare = useSharedValue(0);
  const isTop = level === 'S';
  const glow = skyGlow[level];
  const stops = GRADIENTS[time];
  const sun = todayLayout.sunSize;

  useEffect(() => {
    cancelAnimation(spin);
    cancelAnimation(bounce);
    spin.value = 0;
    bounce.value = 0;
    if (reduceMotion || !isTop) return;
    if (time === 'day') {
      spin.value = withRepeat(
        withTiming(360, { duration: tuning.sky.raySpinMs, easing: Easing.linear }),
        -1,
      );
    } else {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-tuning.sky.moonBounceHeight, { duration: tuning.sky.moonBounceMs }),
          withTiming(0, { duration: tuning.sky.moonBounceMs }),
        ),
        -1,
      );
    }
  }, [isTop, time, reduceMotion, spin, bounce]);

  // Rank moment: flash (always), pulse and ray flare (motion only). Sparkles are their own views.
  useEffect(() => {
    if (!moment) return;
    const m = tuning.moment;
    const r = moment.rank;
    const peak = reduceMotion ? m.reducedMotionFlash[r] : m.flash[r];
    const ms = reduceMotion ? m.reducedMotionFlashMs : m.flashMs;
    flash.value = withSequence(
      withTiming(peak, { duration: ms * 0.3 }),
      withTiming(0, { duration: ms * 0.7 }),
    );
    if (reduceMotion) return;
    const ease = Easing.out(Easing.cubic);
    pulse.value = withSequence(
      withTiming(m.pulse[r], { duration: m.pulseMs / 2, easing: ease }),
      withTiming(1, { duration: m.pulseMs / 2, easing: ease }),
    );
    if (r === 'S' && time === 'day') {
      flare.value = withSequence(
        withTiming(1, { duration: m.rayFlareMs / 2, easing: ease }),
        withTiming(0, { duration: m.rayFlareMs / 2 }),
      );
    }
  }, [moment, reduceMotion, time, flash, pulse, flare]);

  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: pulse.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const flareStyle = useAnimatedStyle(() => ({
    opacity: flare.value,
    transform: [{ scale: 0.8 + flare.value * 0.6 }, { rotate: `${flare.value * 40}deg` }],
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID={`background-${time}`}
      accessibilityLabel={skyDescription(time, level)}
      accessibilityRole="image"
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {stops.map((color, i) => (
              <Stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sky)" />
        {time !== 'day'
          ? STARS.map(([x, y], i) => (
              <Circle
                key={i}
                cx={`${x * 100}%`}
                cy={`${y * 100}%`}
                r={1.5}
                fill={withAlpha(sky.star, 0.4 + glow * 0.6)}
              />
            ))
          : CLOUDS.map(([x, y, w], i) => (
              <Rect
                key={i}
                x={`${x * 100}%`}
                y={`${y * 100}%`}
                width={`${w * 100}%`}
                height={18}
                rx={9}
                fill={sky.dayCloud}
                opacity={0.85}
              />
            ))}
      </Svg>

      {/* Sky flash for the rank moment. The critter is drawn after the Background, so it stays solid. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: sky.dayCloud }, flashStyle]}
        testID="moment-flash"
      />

      <Animated.View style={[styles.body, { width: sun * 3, height: sun * 3 }, bodyStyle]}>
        {time === 'day' ? (
          <Animated.View style={[StyleSheet.absoluteFill, flareStyle]} testID="moment-rays">
            {Array.from({ length: RAY_COUNT }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.ray,
                  {
                    backgroundColor: sky.daySun,
                    transform: [{ rotate: `${(360 / RAY_COUNT) * i + 180 / RAY_COUNT}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}
        {isTop && time === 'day' && !reduceMotion ? (
          <Animated.View style={[StyleSheet.absoluteFill, raysStyle]} testID="sun-rays">
            {Array.from({ length: RAY_COUNT }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.ray,
                  {
                    backgroundColor: withAlpha(sky.daySun, 0.7),
                    transform: [{ rotate: `${(360 / RAY_COUNT) * i}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>
        ) : null}
        {time === 'day' ? (
          <View
            testID="sun"
            style={{ width: sun, height: sun, borderRadius: sun / 2, backgroundColor: BODY[time] }}
          />
        ) : (
          <Svg width={sun} height={sun} testID="moon">
            <Path d={crescent(sun / 2)} fill={BODY[time]} />
          </Svg>
        )}
      </Animated.View>

      {moment && !reduceMotion && tuning.moment.sparkles[moment.rank] > 0 ? (
        <Sparkles key={moment.id} rank={moment.rank} sun={sun} color={sparkleColor(time)} />
      ) : null}
    </View>
  );
}

/** Amber by day (3.5:1 on the day sky), white at dusk and night. */
const sparkleColor = (time: SkyTime) => (time === 'day' ? sky.daySparkle : sky.star);

/** B twinkles around the sun or moon, A bursts out from it, S showers across the sky. */
function Sparkles({ rank, sun, color }: { rank: Rank; sun: number; color: string }) {
  const n = tuning.moment.sparkles[rank];
  const mode = rank === 'B' ? 'twinkle' : rank === 'A' ? 'burst' : 'shower';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={`moment-sparkles-${mode}`}>
      {Array.from({ length: n }, (_, i) => (
        <Sparkle key={i} i={i} n={n} mode={mode} sun={sun} color={color} />
      ))}
    </View>
  );
}

function Sparkle(props: {
  i: number;
  n: number;
  mode: 'twinkle' | 'burst' | 'shower';
  sun: number;
  color: string;
}) {
  const m = tuning.moment;
  const t = useSharedValue(0);
  // Center of the sun or moon: the body box is 3 suns wide, pinned top right.
  const cx = -props.sun * 1.5 + m.sparkleSize / 2;
  const cy = props.sun * 1.5 - m.sparkleSize / 2;
  const angle = (props.i / props.n) * Math.PI * 2;
  // A fixed, uneven spread per sparkle (no randomness during render).
  const spread = ((props.i * 7919) % 97) / 97;
  useEffect(() => {
    const ms =
      props.mode === 'twinkle' ? m.twinkleMs : props.mode === 'burst' ? m.burstMs : m.showerMs;
    const delay =
      props.mode === 'twinkle'
        ? props.i * m.twinkleStaggerMs
        : props.mode === 'shower'
          ? spread * m.showerSpreadMs
          : 0;
    t.value = withDelay(delay, withTiming(1, { duration: ms, easing: Easing.out(Easing.cubic) }));
  }, [t, props.i, props.mode, spread, m]);

  const style = useAnimatedStyle(() => {
    const v = t.value;
    if (props.mode === 'twinkle') {
      return {
        opacity: v < 0.5 ? v * 2 : (1 - v) * 2,
        transform: [
          { translateX: cx + Math.cos(angle) * m.twinkleRadius },
          { translateY: cy + Math.sin(angle) * m.twinkleRadius },
          { scale: v < 0.5 ? v * 2.4 : (1 - v) * 2.4 },
        ],
      };
    }
    if (props.mode === 'burst') {
      const d = m.burstDistance * (0.8 + spread * 0.4) * v;
      return {
        opacity: 1 - v,
        transform: [
          { translateX: cx + Math.cos(angle) * d },
          { translateY: cy + Math.sin(angle) * d },
          { scale: 0.4 + v * 0.6 },
        ],
      };
    }
    return {
      opacity: 1 - v,
      transform: [
        { translateX: -spread * props.sun * 6 },
        // Scattered start heights across the top of the sky, so the shower never reads as a line.
        { translateY: (((props.i * 53) % 97) / 97) * props.sun * 2 + v * m.showerFall },
        { rotate: `${v * 180}deg` },
      ],
    };
  });

  const size = m.sparkleSize;
  return (
    <Animated.View style={[styles.sparkle, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-6 -6 12 12">
        <Path
          d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5Z"
          fill={props.color}
        />
      </Svg>
    </Animated.View>
  );
}

function skyDescription(time: SkyTime, level: SkyLevel): string {
  const body = time === 'day' ? 'sun' : 'moon';
  if (level === 'asleep')
    return `A quiet ${time} sky. The ${body} is waiting for your first check-in.`;
  if (level === 'rest') return `A calm ${time} sky. Rest day.`;
  const feel = { C: 'glowing softly', B: 'glowing', A: 'shining brightly', S: 'blazing' }[level];
  return `The ${body} is ${feel}.`;
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: { position: 'absolute', top: 0, right: 0 },
  ray: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 6,
    height: '50%',
    marginLeft: -3,
    borderRadius: 3,
    transformOrigin: 'top',
  },
});
