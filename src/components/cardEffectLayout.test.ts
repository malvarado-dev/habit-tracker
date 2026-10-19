import { describe, expect, it } from '@jest/globals';
import { tuning } from '@/config/tuning';
import { cardMotion, effectParticles, seeded } from './cardEffectLayout';

const colors = { started: 'pink', onTrack: 'green', nailedIt: 'amber', habit: 'purple' };
const e = tuning.card.effects;

describe('in-card score effects (SPEC-00, T9)', () => {
  it('Started is a small sparkle in the Started color', () => {
    const p = effectParticles('Started', colors, seeded(1));
    expect(p).toHaveLength(e.sparkleCount);
    expect(p.every((x) => x.shape === 'sparkle' && x.color === 'pink')).toBe(true);
  });

  it('On track is an applause pop: one ring plus rising dots', () => {
    const p = effectParticles('OnTrack', colors, seeded(1));
    expect(p.filter((x) => x.shape === 'ring')).toHaveLength(1);
    expect(p.filter((x) => x.shape === 'dot')).toHaveLength(e.popDotCount);
    expect(p.every((x) => x.color === 'green')).toBe(true);
  });

  it('Nailed it is the biggest: two waves of fireworks in amber and the habit color', () => {
    const p = effectParticles('NailedIt', colors, seeded(1));
    expect(p).toHaveLength(e.fireworkFirstWave + e.fireworkSecondWave);
    expect(p.length).toBeGreaterThan(effectParticles('OnTrack', colors, seeded(1)).length);
    expect(new Set(p.map((x) => x.color))).toEqual(new Set(['amber', 'purple']));
    expect(p.some((x) => x.delayMs === e.fireworkWaveGapMs)).toBe(true);
  });

  it('Skip and To do have no particles', () => {
    expect(effectParticles('NotToday', colors)).toEqual([]);
    expect(effectParticles(undefined, colors)).toEqual([]);
  });

  it('every particle stays inside its distance and size ranges', () => {
    for (const p of effectParticles('NailedIt', colors, seeded(7))) {
      expect(p.distance).toBeGreaterThanOrEqual(e.fireworkDistance[0]);
      expect(p.distance).toBeLessThanOrEqual(e.fireworkDistance[1]);
      expect(p.size).toBeGreaterThanOrEqual(e.fireworkSize[0]);
      expect(p.size).toBeLessThanOrEqual(e.fireworkSize[1]);
    }
  });

  it('the same seed gives the same burst', () => {
    expect(effectParticles('NailedIt', colors, seeded(3))).toEqual(
      effectParticles('NailedIt', colors, seeded(3)),
    );
  });

  it('card motion: pulse for On track, none otherwise (no Nailed it bounce)', () => {
    expect(cardMotion('OnTrack')).toBe('pulse');
    expect(cardMotion('NailedIt')).toBe('none');
    expect(cardMotion('Started')).toBe('none');
    expect(cardMotion('NotToday')).toBe('none');
  });
});
