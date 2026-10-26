// P2-15a (#122): pet looks and their snap-on anchors. Top risks: an overlay drifting off the cat
// at another screen size, and a look missing a pose or an anchor.

import { describe, expect, it } from '@jest/globals';

import looksData from './pet-looks.json';
import {
  accessoryBox,
  DEFAULT_PET_LOOK,
  eyeBox,
  isPetLookId,
  PET_LOOK_IDS,
  type LookPose,
} from './petLookData';

const POSES = ['sit', 'walk', 'sleep'] as const;
const pose = (id: string, p: (typeof POSES)[number]) =>
  (looksData as unknown as Record<string, { poses: Record<string, LookPose> }>)[id]!.poses[p]!;

describe('every look is complete (AC 2)', () => {
  it.each(PET_LOOK_IDS)('%s has every pose, inside its image', (id) => {
    for (const p of POSES) {
      const lp = pose(id, p);
      const [w, h] = lp.size;
      for (const part of ['tail', 'leg'] as const) {
        const a = lp[part];
        expect(a.x).toBeGreaterThan(0);
        expect(a.x).toBeLessThan(w);
        expect(a.y).toBeGreaterThan(0);
        expect(a.y).toBeLessThan(h);
        expect(a.w).toBeGreaterThan(0);
      }
    }
  });

  it('looks that close their eyes with a lid have eyes on every awake pose (AC 3)', () => {
    for (const id of PET_LOOK_IDS) {
      const look = (looksData as Record<string, { lid?: unknown }>)[id]!;
      if (!look.lid) continue;
      expect(pose(id, 'sit').eyes).toHaveLength(2);
      expect(pose(id, 'walk').eyes).toHaveLength(2);
    }
  });
});

describe('anchors scale with the pet', () => {
  const lp = pose('tabbyGray', 'sit');
  const box = (k: number) => ({ width: lp.size[0] * k, height: lp.size[1] * k });

  it('the same anchor lands on the same spot of the cat at any size', () => {
    const small = accessoryBox(lp.leg, [100, 81], lp, box(0.2));
    const big = accessoryBox(lp.leg, [100, 81], lp, box(0.5));
    expect(big.left / 0.5).toBeCloseTo(small.left / 0.2);
    expect(big.top / 0.5).toBeCloseTo(small.top / 0.2);
    expect(big.width / 0.5).toBeCloseTo(small.width / 0.2);
  });

  it('a bandage is centred on its anchor and keeps its shape', () => {
    const b = accessoryBox(lp.tail, [87, 134], lp, box(1));
    expect(b.left + b.width / 2).toBeCloseTo(lp.tail.x);
    expect(b.top + b.height / 2).toBeCloseTo(lp.tail.y);
    expect(b.height / b.width).toBeCloseTo(134 / 87);
    expect(b.angle).toBe(lp.tail.angle);
  });

  it('a lid covers its eye', () => {
    const eye = lp.eyes![0]!;
    const b = eyeBox(eye, lp, box(0.5));
    expect(b.left + b.width / 2).toBeCloseTo(eye.x * 0.5);
    expect(b.width).toBeCloseTo(eye.rx * 2 * 0.5);
  });
});

describe('look names', () => {
  it('Tabby-Orange is the default, and only known looks are accepted', () => {
    expect(DEFAULT_PET_LOOK).toBe('tabbyOrange');
    expect(PET_LOOK_IDS).toEqual(['tabbyOrange', 'tabbyGray', 'tabbyGrayReal']);
    expect(isPetLookId('tabbyGray')).toBe(true);
    expect(isPetLookId('toString')).toBe(false);
    expect(isPetLookId('calico')).toBe(false);
  });
});
