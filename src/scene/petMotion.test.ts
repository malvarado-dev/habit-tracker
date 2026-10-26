import { describe, expect, it } from '@jest/globals';

import { tuning } from '@/config/tuning';

import {
  bounceShape,
  canBlink,
  canBounce,
  nextBlink,
  nextBreath,
  nextIdleBounceMs,
} from './petMotion';
import { onPetBounceRequest, requestPetBounce, takePetBounce } from './petBounce';

const m = tuning.pet.motion;
const fixed = (n: number) => () => n;
/** Same tuning with other personality values. */
const withPersonality = (p: { blinkSpeed?: number; bounceSize?: number; idleTiming?: number }) =>
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

describe('bounce', () => {
  it('never bounces with reduced motion or while asleep', () => {
    expect(canBounce('sit', false)).toBe(true);
    expect(canBounce('sit', true)).toBe(false);
    expect(canBounce('sleep', false)).toBe(false);
  });

  it('has anticipation, stretch, and a landing squash', () => {
    const s = bounceShape();
    expect(s.anticipationSquash).toBeGreaterThan(0);
    expect(s.stretch).toBeGreaterThan(0);
    expect(s.landSquash).toBeGreaterThan(0);
  });

  it('bounce size scales the whole bounce', () => {
    const big = bounceShape(withPersonality({ bounceSize: 2 }));
    expect(big.height).toBe(m.bounce.height * 2);
    expect(big.landSquash).toBe(m.bounce.landSquash * 2);
  });

  it('idle bounces wait inside the tuned range, stretched by idle timing', () => {
    expect(nextIdleBounceMs(fixed(0))).toBe(m.bounce.idleGapMinMs);
    expect(nextIdleBounceMs(fixed(0), withPersonality({ idleTiming: 1.5 }))).toBe(
      m.bounce.idleGapMinMs * 1.5,
    );
  });

  it('a Test tools request plays once', () => {
    let heard = 0;
    const off = onPetBounceRequest(() => heard++);
    requestPetBounce();
    off();
    expect(heard).toBe(1);
    expect(takePetBounce()).toBe(true);
    expect(takePetBounce()).toBe(false);
  });
});
