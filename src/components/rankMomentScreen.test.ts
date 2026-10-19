/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { tuning } from '@/config/tuning';

import { crescent } from './skyShapes';

// Acceptance (T15): the rank moment plays in the Background, never blocks taps, keeps the
// critter solid, and is brightness-only with reduced motion. The moon is a crescent.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const bg = read('Background.tsx');
const critter = read('Critter.tsx');
const today = read('../app/index.tsx');
const hook = read('useCritterAndMoment.ts');

describe('acceptance: rank moment on screen (T15)', () => {
  it('never blocks taps: the Background, sparkles, and Zs ignore touches', () => {
    expect(bg).toContain('pointerEvents="none"');
    expect(bg.match(/pointerEvents="none"/g)!.length).toBeGreaterThanOrEqual(2);
    expect(critter).toMatch(/testID="critter-zs"|pointerEvents="none"/);
  });

  it('the flash lights the sky only: the Background is drawn before the critter', () => {
    for (const layout of today.split('<Background').slice(1)) {
      expect(layout.indexOf('<Critter')).toBeGreaterThan(0);
    }
    expect(bg).toContain('testID="moment-flash"');
  });

  it('reduced motion: brightness only, no pulse, sparkles, rays, or hops', () => {
    expect(bg).toMatch(/if \(reduceMotion\) return;\s+const ease/);
    expect(bg).toContain('!reduceMotion && tuning.moment.sparkles');
    expect(critter).toMatch(/if \(!moment \|\| reduceMotion\) return;/);
  });

  it('waits tuning.celebrationDelayMs, and the critter falls asleep when the app closes', () => {
    expect(hook).toContain('tuning.celebrationDelayMs');
    expect(hook).toContain("if (next !== 'active') setWoken(false)");
  });

  it('each rank is bigger than the one below it', () => {
    const order = ['C', 'B', 'A', 'S'] as const;
    for (let i = 1; i < order.length; i++) {
      const [lo, hi] = [order[i - 1]!, order[i]!];
      expect(tuning.moment.pulse[hi]).toBeGreaterThan(tuning.moment.pulse[lo]);
      expect(tuning.moment.reducedMotionFlash[hi]).toBeGreaterThan(
        tuning.moment.reducedMotionFlash[lo],
      );
    }
  });

  it('the body runs past its box by more than the biggest hop', () => {
    expect(tuning.critter.bodyExtension).toBeGreaterThan(
      Math.max(...Object.values(tuning.moment.hopHeight)),
    );
  });

  it('the moon is a crescent, not a full circle', () => {
    const d = crescent(20);
    expect(d.match(/A/g)).toHaveLength(2);
    expect(d).toContain(`A${20 * tuning.sky.crescentInner} 20`);
    expect(bg).toContain('<Path d={crescent(sun / 2)}');
  });
});
