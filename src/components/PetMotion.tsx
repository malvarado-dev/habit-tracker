// The pet's idle motion on its PNG (P2-11, #82). Whole body only until the Rive decision:
// - Breathe: grows from the feet, taller and a touch narrower, each breath a little different,
//   with a rest between breaths. No up/down bob, no even all-over scaling.
// - Blink: random gaps, swaps to the eyes-closed PNG, sometimes twice.
// - Reaction (P2-11b, #106): crouch and hold, jump with a stretch, hang, land hard and spring
//   back, eyes shut on the crouch and the landing. Only on a request (wake, Test tools).
// - Moments (P2-14, #85): eat, pounce, purr from the Activity Bar, petting, and the affection
//   purr. Eyes close and small hearts rise; the bowl or toy comes in (PetMomentLayer). Everything
//   plays one at a time from the moment queue (petMoments.ts). Never random on its own.
// Tap or swipe the awake pet to pet it: it purrs.
// Reduced motion: blink plus breathing at half strength, no reaction. Asleep: slower, deeper
// breaths, no blink, no reaction. Every number is in tuning.pet.motion.

import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
import { momentPlan } from '@/rules/payoff';
import {
  finishPetMoment,
  onPetMomentRequest,
  requestPetReaction,
  requestPetting,
  takePetMoment,
  type PetMoment,
} from '@/scene/petMoments';
import { PetMomentLayer, type HeartSpec, type PropSpec } from './PetMomentLayer';
import {
  canBlink,
  canReact,
  isWake,
  nextBlink,
  nextBreath,
  reactionBeats,
  reactionEyesShut,
  reactionShape,
} from '@/scene/petMotion';
import type { PetLook } from '@/scene/petLooks';
import type { Box, PetPose } from '@/scene/roomGeometry';
import { PetBandages, PetEyeLids } from './PetAccessories';

const motion = tuning.pet.motion;

export function PetMotion({
  pose,
  image,
  look,
  bandages = false,
  shadowBox,
  shadow,
}: {
  pose: PetPose;
  image: Box;
  /** The pet look (P2-15a): its art, and where accessories snap on. */
  look: PetLook;
  /** Show the tail and leg bandages (Test tools check now, the Heal quest next). */
  bandages?: boolean;
  shadowBox: Box;
  /** The contact shadow, drawn at 0,0 inside shadowBox. */
  shadow: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const asleep = pose === 'sleep';
  const art = look.art[pose];
  /** Eyes-closed image (Tabby-Orange), or the lid overlay at the look's eye anchors. */
  const eyesClosedArt = look.eyesClosedArt?.[pose];
  const lookPose = look.poses[pose];
  const lids = !eyesClosedArt && !!look.lid && !!lookPose.eyes;
  const blinks = canBlink(pose) && (!!eyesClosedArt || lids);

  /** Breath depth: 0 is breathed out. */
  const breath = useSharedValue(0);
  /** Above 0 is taller (stretch), below 0 is shorter (squash). */
  const squash = useSharedValue(0);
  /** Points above the floor. */
  const hop = useSharedValue(0);
  const [blinking, setEyesClosed] = useState(false);
  /** Eyes squeezed shut during the reaction's crouch and landing. */
  const [squeezing, setSqueezing] = useState(false);
  /** A pose change can stop blinking mid-blink; never show shut eyes on a pose that can't blink. */
  const eyesClosed = blinks && (blinking || squeezing);

  // Wake: asleep to awake asks for one reaction.
  const lastPose = useRef<PetPose | undefined>(undefined);
  useEffect(() => {
    if (isWake(lastPose.current, pose)) requestPetReaction();
    lastPose.current = pose;
  }, [pose]);

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

  const react = useCallback(() => {
    if (!canReact(pose, reduceMotion)) return [];
    const r = motion.reaction;
    const s = reactionShape();
    const out = Easing.out(Easing.quad);
    squash.set(
      withSequence(
        withTiming(-s.crouchSquash, { duration: r.crouchMs, easing: out }),
        withTiming(-s.crouchSquash, { duration: r.crouchHoldMs }),
        withTiming(s.stretch, { duration: r.riseMs / 2, easing: out }),
        withTiming(0, { duration: r.riseMs / 2 + r.apexHoldMs + r.fallMs / 2 }),
        withTiming(s.stretch / 2, { duration: r.fallMs / 2 }),
        withTiming(-s.landSquash, { duration: r.landMs }),
        withTiming(-s.landSquash, { duration: r.landHoldMs }),
        withSpring(0, { damping: r.settleDamping, stiffness: r.settleStiffness }),
      ),
    );
    hop.set(
      withSequence(
        withTiming(0, { duration: r.crouchMs + r.crouchHoldMs }),
        withTiming(s.height, { duration: r.riseMs, easing: out }),
        withTiming(s.height, { duration: r.apexHoldMs }),
        withTiming(0, { duration: r.fallMs, easing: Easing.in(Easing.quad) }),
      ),
    );
    return reactionEyesShut().flatMap(([from, to]) => [
      setTimeout(() => setSqueezing(true), from),
      setTimeout(() => setSqueezing(false), to),
    ]);
  }, [pose, reduceMotion, squash, hop]);

  const [hearts, setHearts] = useState<HeartSpec[]>([]);
  const [prop, setProp] = useState<PropSpec | null>(null);
  const [moves, setMoves] = useState(true);
  const ids = useRef(0);

  /** Plays one moment and returns how long until the next may start. */
  const run = useCallback(
    (moment: PetMoment, timers: ReturnType<typeof setTimeout>[]): number => {
      const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
      if (moment.kind === 'react') {
        timers.push(...react());
        return reactionBeats().settle + motion.reaction.eyesOpenAfterLandMs;
      }
      const plan = momentPlan(moment.kind, {
        reduceMotion,
        hopMs: reactionBeats().settle + motion.reaction.eyesOpenAfterLandMs,
      });
      setMoves(plan.moves);
      for (const [from, to] of plan.eyesShut) {
        later(() => setSqueezing(true), from);
        later(() => setSqueezing(false), to);
      }
      setHearts(plan.hearts.map((delayMs) => ({ id: ++ids.current, delayMs })));
      if (plan.prop) setProp({ id: ++ids.current, ...plan.prop });
      if (plan.hopAt !== undefined) later(() => timers.push(...react()), plan.hopAt);
      later(() => {
        setHearts([]);
        setProp(null);
      }, plan.totalMs);
      return plan.totalMs;
    },
    [react, reduceMotion],
  );

  // The moment queue: play one at a time while Today is on screen.
  useEffect(() => {
    if (!focused || asleep) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let busy = false;
    const play = () => {
      if (busy) return;
      const moment = takePetMoment();
      if (!moment) return;
      busy = true;
      timers.push(
        setTimeout(() => {
          const ms = run(moment, timers);
          timers.push(
            setTimeout(() => {
              finishPetMoment();
              busy = false;
              play();
            }, ms),
          );
        }, motion.reaction.startDelayMs),
      );
    };
    play();
    const off = onPetMomentRequest(play);
    return () => {
      off();
      timers.forEach(clearTimeout);
      if (busy) finishPetMoment();
      setSqueezing(false);
      setHearts([]);
      setProp(null);
    };
  }, [focused, asleep, run]);

  // Petting: tap or swipe the awake pet and it purrs.
  const petting = Gesture.Race(
    Gesture.Tap()
      .runOnJS(true)
      .onEnd(() => requestPetting()),
    Gesture.Pan()
      .minDistance(tuning.pet.moments.petSwipe)
      .runOnJS(true)
      .onStart(() => requestPetting()),
  );

  const narrow = motion.breath.narrow;
  const squashWidth = motion.reaction.squashWidth;
  const height = Math.max(reactionShape().height, 1);
  const shrink = motion.reaction.shadowShrink;

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
          style={[styles.fill, fillSize(image)]}
          resizeMode="stretch"
          testID="pet-image"
          nativeID={eyesClosed ? 'pet-eyes-closed' : 'pet-eyes-open'}
          accessibilityIgnoresInvertColors
        />
        {/* Both frames stay loaded, so a blink never waits on an image load. */}
        {eyesClosedArt ? (
          <Image
            source={eyesClosedArt}
            style={[styles.fill, fillSize(image), !eyesClosed && styles.hidden]}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {lids && eyesClosed ? <PetEyeLids look={look} pose={lookPose} image={image} /> : null}
        {bandages ? <PetBandages pose={lookPose} image={image} /> : null}
      </Animated.View>
      <PetMomentLayer pet={image} hearts={hearts} prop={prop} moves={moves} />
      {asleep ? null : (
        <GestureDetector gesture={petting}>
          <View
            style={[styles.abs, boxStyle(image)]}
            // The room is decoration to screen readers; petting is for feel only.
            testID="pet-touch"
          />
        </GestureDetector>
      )}
    </>
  );
}

/** The PNG gets the box's exact size, like before P2-11 (absoluteFill doesn't size an Image on web). */
const fillSize = (b: Box) => ({ width: b.width, height: b.height });

const boxStyle = (b: Box) => ({ left: b.left, top: b.top, width: b.width, height: b.height });

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  fill: { position: 'absolute', left: 0, top: 0 },
  // Breathing and squash grow from the paws, not the middle of the body.
  feet: { transformOrigin: 'center bottom' },
  hidden: { opacity: 0 },
});
