// The sky above the critter. Its brightness mirrors the live rank without showing a letter:
// asleep and C are quiet, B glows a little, A is bright, S has rotating sun rays or a
// bouncing moon. Placeholder shapes only; real art comes in Stage 4.

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

import type { SkyLevel } from '@/rules/sky';
import { colors } from '@/theme';

const GLOW: Record<SkyLevel, number> = { asleep: 0, rest: 0.25, C: 0.15, B: 0.35, A: 0.6, S: 0.9 };
const BODY_OPACITY: Record<SkyLevel, number> = {
  asleep: 0.5,
  rest: 0.85,
  C: 0.75,
  B: 0.85,
  A: 1,
  S: 1,
};
const RAY_COUNT = 8;
const BODY_SIZE = 64;

interface SkyProps {
  level: SkyLevel;
  isDay: boolean;
}

export function Sky({ level, isDay }: SkyProps) {
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);
  const pulse = useSharedValue(1);
  const isTop = level === 'S';

  useEffect(() => {
    cancelAnimation(spin);
    cancelAnimation(bounce);
    cancelAnimation(pulse);
    spin.value = 0;
    bounce.value = 0;
    pulse.value = 1;
    if (reduceMotion) return;

    if (isTop && isDay) {
      spin.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1);
    } else if (isTop) {
      bounce.value = withRepeat(
        withSequence(withTiming(-6, { duration: 900 }), withTiming(0, { duration: 900 })),
        -1,
      );
    } else if (level === 'C' || level === 'asleep') {
      // A slow, gentle "come check in" pulse. Never sad, just inviting.
      pulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 1600 }), withTiming(1, { duration: 1600 })),
        -1,
      );
    }
  }, [level, isDay, isTop, reduceMotion, spin, bounce, pulse]);

  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: pulse.value }],
  }));

  const bright = level === 'A' || level === 'S';
  const background = isDay
    ? bright
      ? colors.skyDayBright
      : colors.skyDay
    : bright
      ? colors.skyNightBright
      : colors.skyNight;
  const bodyColor = isDay ? colors.sun : colors.moon;

  return (
    <View
      style={[styles.sky, { backgroundColor: background }]}
      testID="sky"
      accessible
      accessibilityLabel={describeSky(level, isDay)}
    >
      <View style={[styles.cloud, styles.cloudLeft]} />
      <View style={[styles.cloud, styles.cloudRight]} />

      <Animated.View style={[styles.bodyWrap, bodyStyle]} testID={`sky-level-${level}`}>
        {isDay && isTop ? (
          <Animated.View style={[styles.rays, raysStyle]}>
            {Array.from({ length: RAY_COUNT }, (_, i) => (
              <View
                key={i}
                style={[styles.ray, { transform: [{ rotate: `${(360 / RAY_COUNT) * i}deg` }] }]}
              />
            ))}
          </Animated.View>
        ) : null}
        <View
          style={[
            styles.glow,
            {
              backgroundColor: isDay ? colors.sun : colors.moonGlow,
              opacity: GLOW[level],
              transform: [{ scale: 1.7 }],
            },
          ]}
        />
        <View style={[styles.body, { backgroundColor: bodyColor, opacity: BODY_OPACITY[level] }]} />
      </Animated.View>
    </View>
  );
}

function describeSky(level: SkyLevel, isDay: boolean): string {
  const body = isDay ? 'sun' : 'moon';
  switch (level) {
    case 'asleep':
      return `The ${body} is quiet. Check in to wake it up.`;
    case 'rest':
      return `A calm ${body} for a rest day.`;
    case 'C':
      return `The ${body} is waking up.`;
    case 'B':
      return `The ${body} is glowing.`;
    case 'A':
      return `The ${body} is bright.`;
    case 'S':
      return `The ${body} is blazing with energy.`;
  }
}

const styles = StyleSheet.create({
  sky: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  bodyWrap: {
    position: 'absolute',
    top: 20,
    right: 28,
    width: BODY_SIZE,
    height: BODY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: BODY_SIZE,
    height: BODY_SIZE,
    borderRadius: BODY_SIZE / 2,
  },
  glow: {
    position: 'absolute',
    width: BODY_SIZE,
    height: BODY_SIZE,
    borderRadius: BODY_SIZE / 2,
  },
  rays: {
    position: 'absolute',
    width: BODY_SIZE * 2.2,
    height: BODY_SIZE * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 6,
    height: BODY_SIZE * 2.2,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 214, 90, 0.55)',
  },
  cloud: {
    position: 'absolute',
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.cloud,
    opacity: 0.8,
  },
  cloudLeft: { top: 36, left: 24, width: 70 },
  cloudRight: { top: 70, right: 110, width: 50 },
});
