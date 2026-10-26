import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';

import {
  canBlink,
  canReact,
  isWake,
  nextBlink,
  nextBreath,
  reactionBeats,
  reactionEyesShut,
  reactionShape,
} from './petMotion';

const m = tuning.pet.motion;
const fixed = (n: number) => () => n;
/** Same tuning with other personality values. */
const withPersonality = (p: { blinkSpeed?: number; reactionSize?: number; idleTiming?: number }) =>
  ({ ...m, personality: { ...m.personality, ...p } }) as unknown as typeof m;

describe('blink', () => {
  it('waits a random gap inside the tuned range', () => {
    expect(nextBlink(fixed(0)).gapMs).toBe(m.blink.gapMinMs);
    expect(nextBlink(fixed(0.999)).gapMs).toBeLessThan(m.blink.gapMaxMs);
    expect(nextBlink(fixed(0.999)).gapMs).toBeGreaterThan(m.blink.gapMinMs);
  });

  it('doubles only as often as doubleChance', () => {
    expect(nextBlink(fixed(0)).double).toBe(true);
    expect(nextBlink(fixed(0.99)).double).toBe(false);
  });

  it('blink speed shortens the closed eyes; idle timing stretches the gap', () => {
    const quick = nextBlink(fixed(0), withPersonality({ blinkSpeed: 2, idleTiming: 2 }));
    expect(quick.closedMs).toBe(m.blink.closedMs / 2);
    expect(quick.gapMs).toBe(m.blink.gapMinMs * 2);
  });

  it('never blinks in the sleep pose', () => {
    expect(canBlink('sit')).toBe(true);
    expect(canBlink('walk')).toBe(true);
    expect(canBlink('sleep')).toBe(false);
  });
});

describe('breathing', () => {
  const awake = { asleep: false, reduceMotion: false };

  it('varies depth from breath to breath (no constant loop)', () => {
    const shallow = nextBreath(fixed(0), awake).depth;
    const deep = nextBreath(fixed(0.99), awake).depth;
    expect(deep).toBeGreaterThan(shallow);
    expect(shallow).toBeCloseTo(m.breath.rise * (1 - m.breath.riseVariation));
  });

  it('rests between breaths', () => {
    expect(nextBreath(fixed(0), awake).holdMs).toBeGreaterThanOrEqual(m.breath.holdMinMs);
    expect(m.breath.holdMinMs).toBeGreaterThan(0);
  });

  it('reduced motion breathes at half strength', () => {
    const full = nextBreath(fixed(0.5), awake).depth;
    const reduced = nextBreath(fixed(0.5), { asleep: false, reduceMotion: true }).depth;
    expect(reduced).toBeCloseTo(full * m.breath.reducedMotionStrength);
    expect(m.breath.reducedMotionStrength).toBe(0.5);
  });

  it('asleep breaths are slower', () => {
    const a = nextBreath(fixed(0.5), awake);
    const s = nextBreath(fixed(0.5), { asleep: true, reduceMotion: false });
    expect(s.inMs).toBeCloseTo(a.inMs * m.breath.sleepSlowdown);
  });
});

describe('reaction', () => {
  it('never reacts with reduced motion or while asleep', () => {
    expect(canReact('sit', false)).toBe(true);
    expect(canReact('sit', true)).toBe(false);
    expect(canReact('sleep', false)).toBe(false);
  });

  it('waking is asleep to awake, and nothing else', () => {
    expect(isWake('sleep', 'sit')).toBe(true);
    expect(isWake('sleep', 'walk')).toBe(true);
    expect(isWake(undefined, 'sit')).toBe(false);
    expect(isWake('sit', 'sit')).toBe(false);
    expect(isWake('sit', 'sleep')).toBe(false);
    expect(isWake('sleep', 'sleep')).toBe(false);
  });

  it('reaction size scales the distances', () => {
    const big = reactionShape(withPersonality({ reactionSize: 2 }));
    expect(big.height).toBe(m.reaction.height * 2);
    expect(big.crouchSquash).toBe(m.reaction.crouchSquash * 2);
    expect(big.landSquash).toBe(m.reaction.landSquash * 2);
  });

  it('beats run in order: crouch, jump, fall, land, settle', () => {
    const b = reactionBeats();
    expect(0).toBeLessThan(b.jump);
    expect(b.jump).toBeLessThan(b.fall);
    expect(b.fall).toBeLessThan(b.land);
    expect(b.land).toBeLessThan(b.settle);
  });

  it('eyes are shut for the crouch and the landing, open in the air', () => {
    const b = reactionBeats();
    const [crouch, landing] = reactionEyesShut();
    expect(crouch).toEqual([0, b.jump]);
    expect(landing[0]).toBe(b.land);
    expect(landing[1]).toBeGreaterThan(b.settle);
  });
});
