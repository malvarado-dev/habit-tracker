// The critter (critter.md): a flat sunny dome with eyes and a mouth, its body running behind the
// habit sheet. Idle motion is subtle: slow breathing, a blink every few seconds, and an
// occasional glance. Asleep before the first check-in; the first check-in wakes it with a hop.
// It hops a little on each score, its mouth follows the live rank, and a soft halo behind it
// grows with today's score. Tap plays a small wiggle.
// Reduced motion: breathing at half strength and blinking stay; glancing, hops, and the wiggle
// are off, and the halo changes without fading.

import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { critter } from '@/design/tokens';
import type { SkyLevel } from '@/rules/sky';

import { critterGlow, critterLabel, critterMood, randomGap, type CritterMood } from './critterMood';

const VIEW_W = 360;
const VIEW_H = 260;
const EYE_Y = 105;
const EYE_R = 10;
const EYES_X = [150, 210];

type Props = {
  width: number;
  level: SkyLevel;
  /** Today's daily score, 0 to 1, or null when nothing counts yet. */
  score: number | null;
  /** Changes whenever a habit is scored, so the critter can hop. */
  reactKey: string;
};

export function Critter({ width, level, score, reactKey }: Props) {
  const reduceMotion = useReducedMotion();
  const mood = critterMood(level);
  const asleep = mood === 'asleep';
  const s = width / VIEW_W;
  const height = width * (VIEW_H / VIEW_W);
  const c = tuning.critter;

  const turn = useSharedValue(0);
  const hop = useSharedValue(0);
  const stretch = useSharedValue(0);
  const breath = useSharedValue(0);
  const blink = useSharedValue(0);
  const glance = useSharedValue(0);
  const glow = useSharedValue(critterGlow(level, score));

  // Breathing: never stops, slower asleep, half strength with reduced motion.
  useEffect(() => {
    const half = asleep ? c.breathMs * c.sleepBreathSlowdown : c.breathMs;
    const ease = Easing.inOut(Easing.sin);
    breath.value = 0;
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: ease }),
        withTiming(0, { duration: half, easing: ease }),
      ),
      -1,
    );
  }, [asleep, breath, c.breathMs, c.sleepBreathSlowdown]);

  // Blinking: random gaps, sometimes a double blink. Awake only.
  useEffect(() => {
    if (asleep) return;
    let timer: ReturnType<typeof setTimeout>;
    const half = c.blinkMs / 2;
    const once = [withTiming(1, { duration: half }), withTiming(0, { duration: half })];
    const schedule = () => {
      timer = setTimeout(
        () => {
          blink.value =
            Math.random() < c.doubleBlinkChance
              ? withSequence(...once, withTiming(0, { duration: c.blinkMs }), ...once)
              : withSequence(...once);
          schedule();
        },
        randomGap(c.blinkGapMinMs, c.blinkGapMaxMs),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [asleep, blink, c.blinkMs, c.doubleBlinkChance, c.blinkGapMinMs, c.blinkGapMaxMs]);

  // Glancing: an occasional look left or right. Awake, and off with reduced motion.
  useEffect(() => {
    if (asleep || reduceMotion) {
      glance.value = 0;
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          const to = (Math.random() < 0.5 ? -1 : 1) * c.glanceDistance;
          glance.value = withSequence(
            withTiming(to, { duration: c.glanceMoveMs }),
            withDelay(c.glanceHoldMs, withTiming(0, { duration: c.glanceMoveMs })),
          );
          schedule();
        },
        randomGap(c.glanceGapMinMs, c.glanceGapMaxMs),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [asleep, reduceMotion, glance, c]);

  // Wake-up hop on the first check-in, and a small hop on every later score.
  const prevMood = useRef<CritterMood>(mood);
  const prevKey = useRef(reactKey);
  useEffect(() => {
    const woke = prevMood.current === 'asleep' && mood !== 'asleep';
    const scored = prevKey.current !== reactKey;
    prevMood.current = mood;
    prevKey.current = reactKey;
    if (reduceMotion || asleep) return;
    if (woke) {
      hop.value = withSequence(
        withTiming(-c.wakeHop, { duration: c.scoreHopMs }),
        withSpring(0, { damping: c.wakeDamping }),
      );
      stretch.value = withSequence(
        withTiming(c.wakeStretch, { duration: c.scoreHopMs }),
        withSpring(0, { damping: c.wakeDamping }),
      );
    } else if (scored) {
      hop.value = withSequence(
        withTiming(-c.scoreHop, { duration: c.scoreHopMs }),
        withTiming(0, { duration: c.scoreHopMs }),
      );
    }
  }, [mood, reactKey, reduceMotion, asleep, hop, stretch, c]);

  // Halo follows today's score.
  const glowTarget = critterGlow(level, score);
  useEffect(() => {
    glow.value = reduceMotion ? glowTarget : withTiming(glowTarget, { duration: c.glowFadeMs });
  }, [glowTarget, reduceMotion, glow, c.glowFadeMs]);

  const breathStrength = reduceMotion ? c.reducedMotionBreathStrength : 1;

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value }, { rotate: `${turn.value}deg` }],
  }));
  const bodyStyle = useAnimatedStyle(() => {
    const grow = 1 + c.breathScale * breathStrength * breath.value;
    return { transform: [{ scaleX: grow }, { scaleY: grow + stretch.value }] };
  });
  const eyesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glance.value * s }, { scaleY: 1 - 0.9 * blink.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const wiggle = () => {
    if (reduceMotion) return;
    const { wiggleDegrees: d, wiggleMs: ms } = c;
    turn.value = withSequence(
      withTiming(-d, { duration: ms }),
      withTiming(d, { duration: ms * 2 }),
      withTiming(0, { duration: ms }),
    );
  };

  const haloSize = width * c.glowSize;

  return (
    <Pressable
      onPress={wiggle}
      testID="critter"
      accessibilityRole="button"
      accessibilityLabel={critterLabel(mood)}
      accessibilityHint="Tap to make it wiggle."
    >
      <Animated.View style={[{ width, height }, outerStyle]}>
        <Animated.View
          testID="critter-glow"
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: haloSize,
              height: haloSize,
              borderRadius: haloSize / 2,
              left: (width - haloSize) / 2,
              top: height * 0.55 - haloSize / 2,
              backgroundColor: critter.bodySunny,
            },
            glowStyle,
          ]}
        />
        <Animated.View
          testID="critter-body"
          style={[StyleSheet.absoluteFill, styles.body, bodyStyle]}
        >
          <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            <Path
              d="M0 260 L0 170 Q0 30 180 30 Q360 30 360 170 L360 260 Z"
              fill={critter.bodySunny}
            />
            {asleep ? <SleepyEyes /> : null}
            <Mouth mood={mood} />
          </Svg>
          {asleep ? null : (
            <Animated.View
              testID="critter-eyes"
              style={[
                styles.eyes,
                { top: (EYE_Y - EYE_R) * s, height: EYE_R * 2 * s, width },
                eyesStyle,
              ]}
            >
              {EYES_X.map((x) => (
                <View
                  key={x}
                  style={[
                    styles.eye,
                    {
                      left: (x - EYE_R) * s,
                      width: EYE_R * 2 * s,
                      height: EYE_R * 2 * s,
                      borderRadius: EYE_R * s,
                      backgroundColor: critter.ink,
                    },
                  ]}
                />
              ))}
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function SleepyEyes() {
  return (
    <>
      <Path
        d="M140 105 Q150 113 160 105"
        stroke={critter.ink}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M200 105 Q210 113 220 105"
        stroke={critter.ink}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

function Mouth({ mood }: { mood: CritterMood }) {
  if (mood === 'asleep') {
    return (
      <Path
        d="M170 140 Q180 144 190 140"
        stroke={critter.ink}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (mood === 'okay') {
    return (
      <Path
        d="M164 136 Q180 146 196 136"
        stroke={critter.ink}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (mood === 'happy') {
    return (
      <>
        <Path
          d="M154 127 Q180 129 206 127 Q202 157 180 157 Q158 157 154 127 Z"
          fill={critter.ink}
        />
        <Path
          d="M168 149 Q180 141 192 149 Q188 157 180 157 Q172 157 168 149 Z"
          fill={critter.mouth}
        />
      </>
    );
  }
  return (
    <>
      <Path d="M146 124 Q180 128 214 124 Q210 170 180 170 Q150 170 146 124 Z" fill={critter.ink} />
      <Path
        d="M164 160 Q180 148 196 160 Q190 170 180 170 Q170 170 164 160 Z"
        fill={critter.mouth}
      />
    </>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  body: { transformOrigin: 'bottom' },
  eyes: { position: 'absolute', left: 0 },
  eye: { position: 'absolute', top: 0 },
});
