// Timing rules for the pet's idle motion (P2-11, #82). Pure functions, so tests can pass a fixed
// random source. Every number comes from tuning.pet.motion; the personality multipliers apply here.

import { tuning } from '@/config/tuning';
import type { PetPose } from '@/scene/roomGeometry';

/** Returns a number from 0 up to (not including) 1, like Math.random. */
export type Rand = () => number;

type Motion = typeof tuning.pet.motion;

const between = (min: number, max: number, rand: Rand) => min + (max - min) * rand();

export type Blink = {
  /** Wait before this blink starts. */
  gapMs: number;
  /** How long the eyes stay shut. */
  closedMs: number;
  /** Blink twice in a row. */
  double: boolean;
};

export function nextBlink(rand: Rand, m: Motion = tuning.pet.motion): Blink {
  const { blink, personality } = m;
  return {
    gapMs: between(blink.gapMinMs, blink.gapMaxMs, rand) * personality.idleTiming,
    closedMs: blink.closedMs / personality.blinkSpeed,
    double: rand() < blink.doubleChance,
  };
}

export type Breath = {
  /** Share of extra height at the top of the breath. */
  depth: number;
  inMs: number;
  outMs: number;
  /** Rest after breathing out, before the next breath. */
  holdMs: number;
};

export function nextBreath(
  rand: Rand,
  { asleep, reduceMotion }: { asleep: boolean; reduceMotion: boolean },
  m: Motion = tuning.pet.motion,
): Breath {
  const b = m.breath;
  const slow = asleep ? b.sleepSlowdown : 1;
  const strength = (asleep ? b.sleepDepth : 1) * (reduceMotion ? b.reducedMotionStrength : 1);
  const vary = 1 + b.riseVariation * (rand() * 2 - 1);
  return {
    depth: b.rise * vary * strength,
    inMs: between(b.inMinMs, b.inMaxMs, rand) * slow,
    outMs: between(b.outMinMs, b.outMaxMs, rand) * slow,
    holdMs: between(b.holdMinMs, b.holdMaxMs, rand) * slow,
  };
}

export function nextIdleBounceMs(rand: Rand, m: Motion = tuning.pet.motion): number {
  const { bounce, personality } = m;
  return between(bounce.idleGapMinMs, bounce.idleGapMaxMs, rand) * personality.idleTiming;
}

/** The sleep pose already has its eyes shut, so it never blinks. */
export const canBlink = (pose: PetPose) => pose !== 'sleep';

/** No bounce while asleep, and none with reduced motion (pet.md). */
export const canBounce = (pose: PetPose, reduceMotion: boolean) =>
  pose !== 'sleep' && !reduceMotion;

/** Bounce numbers with the personality's bounce size applied. */
export function bounceShape(m: Motion = tuning.pet.motion) {
  const { bounce: b, personality } = m;
  const k = personality.bounceSize;
  return {
    anticipationSquash: b.anticipationSquash * k,
    height: b.height * k,
    stretch: b.stretch * k,
    landSquash: b.landSquash * k,
  };
}
