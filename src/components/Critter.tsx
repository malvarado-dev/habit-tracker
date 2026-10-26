// The critter (critter.md): a flat sunny dome with eyes and a mouth, its body running behind the
// habit sheet and well past its box, so a hop never shows an edge. Idle motion is subtle: slow
// breathing, a blink every few seconds, and an occasional glance. The mouth follows the Activity
// Bar (critterMood). Before the first log it's asleep when the app opens, with Zs drifting up; a
// tap or a log wakes it with a hop. No hop on later logs (P2-08a). Tap an awake critter to wiggle.
// Wide layout only: the phone shows the living room and pet instead.
// Reduced motion: breathing at half strength and blinking stay, the Zs hold still; glancing,
// hops, and the wiggle are off.

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
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { background as sky, critter } from '@/design/tokens';
import type { SkyLevel, SkyTime } from '@/rules/sky';

import { critterLabel, critterMood, randomGap, type CritterMood } from './critterMood';

const VIEW_W = 360;
const VIEW_H = 260;
export const EYE_Y = 105;
export const EYE_R = 10;
export const EYES_X = [150, 210];
/** The dome. History's day faces (CritterFace) draw the same parts. */
export const BODY_PATH = 'M0 260 L0 170 Q0 30 180 30 Q360 30 360 170 L360 260 Z';

type Props = {
  width: number;
  level: SkyLevel;
  /** Woken this visit by a tap or a log (see critterMood). */
  woken: boolean;
  onWake: () => void;
  /** Sky time, so the Zs are dark on the day sky and light at dusk and night. */
  time: SkyTime;
};

export function Critter({ width, level, woken, onWake, time }: Props) {
  const reduceMotion = useReducedMotion();
  const mood = critterMood(level, woken);
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

  // Wake-up hop on the first log or tap.
  const prevMood = useRef<CritterMood>(mood);
  useEffect(() => {
    const woke = prevMood.current === 'asleep' && mood !== 'asleep';
    prevMood.current = mood;
    if (reduceMotion || !woke) return;
    hop.value = withSequence(
      withTiming(-c.wakeHop, { duration: c.wakeHopMs }),
      withSpring(0, { damping: c.wakeDamping }),
    );
    stretch.value = withSequence(
      withTiming(c.wakeStretch, { duration: c.wakeHopMs }),
      withSpring(0, { damping: c.wakeDamping }),
    );
  }, [mood, reduceMotion, hop, stretch, c]);

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

  const onPress = () => {
    if (asleep) return onWake();
    if (reduceMotion) return;
    const { wiggleDegrees: d, wiggleMs: ms } = c;
    turn.value = withSequence(
      withTiming(-d, { duration: ms }),
      withTiming(d, { duration: ms * 2 }),
      withTiming(0, { duration: ms }),
    );
  };

  return (
    <Pressable
      onPress={onPress}
      testID="critter"
      accessibilityRole="button"
      accessibilityLabel={critterLabel(mood)}
      accessibilityHint={asleep ? 'Tap to wake it up.' : 'Tap to make it wiggle.'}
    >
      {asleep ? <Zs width={width} time={time} still={reduceMotion} /> : null}
      <Animated.View style={[{ width, height }, outerStyle]}>
        <Animated.View
          testID="critter-body"
          style={[StyleSheet.absoluteFill, styles.body, bodyStyle]}
        >
          <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            <Path d={BODY_PATH} fill={critter.bodySunny} />
            {asleep ? <SleepyEyes /> : null}
            <Mouth mood={mood} />
          </Svg>
          {/* The body keeps going below the box, so hops never show its bottom edge. */}
          <View
            testID="critter-body-extension"
            style={[
              styles.extension,
              { top: height - 1, height: c.bodyExtension * s, backgroundColor: critter.bodySunny },
            ]}
          />
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

export function SleepyEyes() {
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

export function Mouth({ mood }: { mood: CritterMood }) {
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
  // C (awake) and Rest day: a flat mouth.
  if (mood === 'flat') {
    return (
      <Path d="M166 138 L194 138" stroke={critter.ink} strokeWidth={6} strokeLinecap="round" />
    );
  }
  // B: a closed smile.
  if (mood === 'smile') {
    return (
      <Path
        d="M156 132 Q180 154 204 132"
        stroke={critter.ink}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  // A and S: a big open smile.
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

/** Zs drifting up beside the head while asleep. Still with reduced motion. */
function Zs({ width, time, still }: { width: number; time: SkyTime; still: boolean }) {
  const c = tuning.critter;
  const s = width / VIEW_W;
  const color = time === 'day' ? sky.onSkyDay : sky.onSkyDark;
  return (
    <View
      style={[styles.zs, { left: 230 * s, top: -10 * s }]}
      pointerEvents="none"
      testID="critter-zs"
    >
      {[0, 1, 2].map((i) => (
        <DriftingZ key={i} index={i} size={(c.zSize + i * 3) * s} color={color} still={still} />
      ))}
    </View>
  );
}

function DriftingZ(props: { index: number; size: number; color: string; still: boolean }) {
  const c = tuning.critter;
  const t = useSharedValue(props.still ? 0.5 : 0);
  useEffect(() => {
    if (props.still) {
      t.value = 0.5;
      return;
    }
    t.value = withDelay(
      props.index * c.zStaggerMs,
      withRepeat(withTiming(1, { duration: c.zDriftMs, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [props.still, props.index, t, c.zStaggerMs, c.zDriftMs]);
  const style = useAnimatedStyle(() => ({
    opacity: props.still ? 0.8 : t.value < 0.3 ? t.value / 0.3 : 1 - (t.value - 0.3) / 0.7,
    transform: [
      { translateX: props.index * props.size * 0.8 + t.value * c.zRise * 0.4 },
      { translateY: -props.index * props.size * 0.8 - t.value * c.zRise },
    ],
  }));
  return (
    <Animated.View style={[styles.z, style]}>
      <Svg width={props.size * 1.2} height={props.size * 1.2}>
        <SvgText x={0} y={props.size} fontSize={props.size} fontWeight="700" fill={props.color}>
          {props.index === 2 ? 'Z' : 'z'}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { transformOrigin: 'bottom' },
  eyes: { position: 'absolute', left: 0 },
  eye: { position: 'absolute', top: 0 },
  extension: { position: 'absolute', left: 0, right: 0 },
  zs: { position: 'absolute' },
  z: { position: 'absolute', left: 0, top: 0 },
});
