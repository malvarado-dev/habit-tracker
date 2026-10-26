// The pet's idle motion on its PNG (P2-11, #82). Whole body only until the Rive decision:
// - Breathe: grows from the feet, taller and a touch narrower, each breath a little different,
//   with a rest between breaths. No up/down bob, no even all-over scaling.
// - Blink: random gaps, swaps to the eyes-closed PNG, sometimes twice.
// - Small bounce: squash (anticipation), hop with a stretch, squash on landing, spring settle.
//   Plays now and then while awake, and when Test tools asks for one (petBounce.ts).
// Reduced motion: blink plus breathing at half strength, no bounce. Asleep: slower, deeper
// breaths, no blink, no bounce. Every number is in tuning.pet.motion.

import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { tuning } from '@/config/tuning';
import { onPetBounceRequest, takePetBounce } from '@/scene/petBounce';
import {
  bounceShape,
  canBlink,
  canBounce,
  nextBlink,
  nextBreath,
  nextIdleBounceMs,
} from '@/scene/petMotion';
import type { Box, PetPose } from '@/scene/roomGeometry';

const motion = tuning.pet.motion;

export function PetMotion({
  pose,
  image,
  art,
  eyesClosedArt,
  shadowBox,
  shadow,
}: {
  pose: PetPose;
  image: Box;
  art: ImageSourcePropType;
  /** The same pose with the eyes shut. Left out for poses that never blink. */
  eyesClosedArt?: ImageSourcePropType;
  shadowBox: Box;
  /** The contact shadow, drawn at 0,0 inside shadowBox. */
  shadow: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const asleep = pose === 'sleep';
  const blinks = canBlink(pose) && !!eyesClosedArt;

  /** Breath depth: 0 is breathed out. */
  const breath = useSharedValue(0);
  /** Above 0 is taller (stretch), below 0 is shorter (squash). */
  const squash = useSharedValue(0);
  /** Points above the floor. */
  const hop = useSharedValue(0);
  const [blinking, setEyesClosed] = useState(false);
  /** A pose change can stop blinking mid-blink; never show shut eyes on a pose that can't blink. */
  const eyesClosed = blinks && blinking;

  // Breathing: one breath at a time, each with its own length, depth, and rest.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const breathe = () => {
      const b = nextBreath(Math.random, { asleep, reduceMotion });
      breath.value = withSequence(
        withTiming(b.depth, { duration: b.inMs, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: b.outMs, easing: Easing.out(Easing.quad) }),
      );
      timer = setTimeout(breathe, b.inMs + b.outMs + b.holdMs);
    };
    breathe();
    return () => {
      clearTimeout(timer);
      cancelAnimation(breath);
      breath.value = 0;
    };
  }, [asleep, reduceMotion, breath]);

  // Blinking: random gaps, sometimes a double blink.
  useEffect(() => {
    if (!blinks) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const shut = (ms: number, then: () => void) => {
      setEyesClosed(true);
      timer = setTimeout(() => {
        setEyesClosed(false);
        then();
      }, ms);
    };
    const schedule = () => {
      const b = nextBlink(Math.random);
      timer = setTimeout(() => {
        shut(b.closedMs, () => {
          if (!b.double) return schedule();
          timer = setTimeout(() => shut(b.closedMs, schedule), motion.blink.doubleGapMs);
        });
      }, b.gapMs);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [blinks]);

  const bounce = useCallback(() => {
    if (!canBounce(pose, reduceMotion)) return;
    const b = motion.bounce;
    const s = bounceShape();
    const ease = Easing.out(Easing.quad);
    squash.set(
      withSequence(
        withTiming(-s.anticipationSquash, { duration: b.anticipationMs, easing: ease }),
        withTiming(s.stretch, { duration: b.riseMs / 2 }),
        withTiming(0, { duration: b.riseMs / 2 + b.apexHoldMs + b.fallMs / 2 }),
        withTiming(s.stretch / 2, { duration: b.fallMs / 2 }),
        withTiming(-s.landSquash, { duration: b.landMs }),
        withSpring(0, { damping: b.settleDamping, stiffness: b.settleStiffness }),
      ),
    );
    hop.set(
      withSequence(
        withTiming(0, { duration: b.anticipationMs }),
        withTiming(s.height, { duration: b.riseMs, easing: ease }),
        withTiming(s.height, { duration: b.apexHoldMs }),
        withTiming(0, { duration: b.fallMs, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [pose, reduceMotion, squash, hop]);

  // Idle bounces now and then, only while Today is on screen.
  useEffect(() => {
    if (!focused || !canBounce(pose, reduceMotion)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => {
        bounce();
        schedule();
      }, nextIdleBounceMs(Math.random));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [focused, pose, reduceMotion, bounce]);

  // Bounce requests (Test tools): play once the pet is on screen.
  useEffect(() => {
    if (!focused) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const play = () => {
      if (!takePetBounce()) return;
      clearTimeout(timer);
      timer = setTimeout(bounce, motion.bounce.testDelayMs);
    };
    play();
    const off = onPetBounceRequest(play);
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [focused, bounce]);

  const narrow = motion.breath.narrow;
  const squashWidth = motion.bounce.squashWidth;
  const height = Math.max(bounceShape().height, 1);
  const shrink = motion.bounce.shadowShrink;

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -hop.value },
      { scaleX: 1 - breath.value * narrow - squash.value * squashWidth },
      { scaleY: 1 + breath.value + squash.value },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => {
    const s = 1 - shrink * Math.min(hop.value / height, 1);
    return { transform: [{ scaleX: s }, { scaleY: s }] };
  });

  return (
    <>
      <Animated.View
        style={[styles.abs, boxStyle(shadowBox), shadowStyle]}
        pointerEvents="none"
        testID="pet-shadow"
      >
        {shadow}
      </Animated.View>
      <Animated.View
        style={[styles.abs, styles.feet, boxStyle(image), bodyStyle]}
        pointerEvents="none"
        testID="pet-body"
      >
        <Image
          source={art}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
          testID="pet-image"
          nativeID={eyesClosed ? 'pet-eyes-closed' : 'pet-eyes-open'}
          accessibilityIgnoresInvertColors
        />
        {/* Both frames stay loaded, so a blink never waits on an image load. */}
        {eyesClosedArt ? (
          <Image
            source={eyesClosedArt}
            style={[StyleSheet.absoluteFill, !eyesClosed && styles.hidden]}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </Animated.View>
    </>
  );
}

const boxStyle = (b: Box) => ({ left: b.left, top: b.top, width: b.width, height: b.height });

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  // Breathing and squash grow from the paws, not the middle of the body.
  feet: { transformOrigin: 'center bottom' },
  hidden: { opacity: 0 },
});
