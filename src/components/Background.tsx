// The Background (background.md): the full-screen sky behind the critter on the wide layout. It
// changes only with time of day and the Activity Bar (sky.ts), never with the theme. Placeholder
// art from Prototype 1. The moon is a crescent so it never reads as the sun. Once the bar is full
// the sun's rays turn (or the moon bounces). Ranks and the rank moment were removed in P2-08a.
// It never takes touches. Reduced motion: no movement.

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
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { withAlpha } from '@/design/theme/theme';
import { background as sky, skyGlow, todayLayout } from '@/design/tokens';
import type { SkyLevel, SkyTime } from '@/rules/sky';

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

export function Background({ time, level }: { time: SkyTime; level: SkyLevel }) {
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);
  const isTop = level === 'full';
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

  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

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

      <Animated.View style={[styles.body, { width: sun * 3, height: sun * 3 }, bodyStyle]}>
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
    </View>
  );
}

function skyDescription(time: SkyTime, level: SkyLevel): string {
  const body = time === 'day' ? 'sun' : 'moon';
  if (level === 'asleep')
    return `A quiet ${time} sky. The ${body} is waiting for your first check-in.`;
  if (level === 'rest') return `A calm ${time} sky. Rest day.`;
  const feel = level === 'full' ? 'blazing' : 'glowing';
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
