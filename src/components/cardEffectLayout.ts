// Layout for the in-card score effects (SPEC-00, T9), kept apart from the component so it can be
// tested without rendering. Every particle is a plain shape: same look on Android, iPad, and web.
// Started = small sparkle, On track = applause pop (ring burst plus rising dots),
// Nailed it = fireworks (two waves with trails). Not today has no particles; the card dims.

import { tuning } from '@/config/tuning';
import type { CheckIn } from '@/rules/scoring';

export type ParticleShape = 'sparkle' | 'dot' | 'ring' | 'trail';

export interface Particle {
  shape: ParticleShape;
  /** Direction in degrees, 0 = right, -90 = up. */
  angle: number;
  /** How far it travels from the stars, in points. */
  distance: number;
  /** Size in points. */
  size: number;
  color: string;
  /** Wait before it starts, in ms. */
  delayMs: number;
}

export interface EffectColors {
  started: string;
  onTrack: string;
  nailedIt: string;
  habit: string;
}

/** Card motion that goes with each score: none, a soft pulse, or a bounce. */
export type CardMotion = 'none' | 'pulse' | 'bounce';

export function cardMotion(checkIn: CheckIn | undefined): CardMotion {
  if (checkIn === 'OnTrack') return 'pulse';
  if (checkIn === 'NailedIt') return 'bounce';
  return 'none';
}

/** A small seeded random, so a burst looks varied but tests stay predictable. */
export function seeded(seed: number): () => number {
  let x = seed % 2147483647 || 1;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

const between = (rand: () => number, [min, max]: readonly [number, number]) =>
  min + (max - min) * rand();

export function effectParticles(
  checkIn: CheckIn | undefined,
  colors: EffectColors,
  rand: () => number = Math.random,
): Particle[] {
  const e = tuning.card.effects;

  if (checkIn === 'Started') {
    return Array.from({ length: e.sparkleCount }, (_, i) => ({
      shape: 'sparkle' as const,
      angle: -160 + (140 / Math.max(e.sparkleCount - 1, 1)) * i + between(rand, [-12, 12]),
      distance: between(rand, e.sparkleDistance),
      size: between(rand, e.sparkleSize),
      color: colors.started,
      delayMs: i * e.sparkleStaggerMs,
    }));
  }

  if (checkIn === 'OnTrack') {
    const dots = Array.from({ length: e.popDotCount }, (_, i) => ({
      shape: 'dot' as const,
      angle: -150 + (120 / Math.max(e.popDotCount - 1, 1)) * i + between(rand, [-8, 8]),
      distance: between(rand, e.popDotDistance),
      size: between(rand, e.popDotSize),
      color: colors.onTrack,
      delayMs: e.popDotDelayMs,
    }));
    return [
      {
        shape: 'ring',
        angle: 0,
        distance: 0,
        size: e.popRingSize,
        color: colors.onTrack,
        delayMs: 0,
      },
      ...dots,
    ];
  }

  if (checkIn === 'NailedIt') {
    const wave = (count: number, delayMs: number, offset: number) =>
      Array.from({ length: count }, (_, i) => ({
        shape: 'trail' as const,
        angle: offset + (360 / count) * i + between(rand, [-10, 10]),
        distance: between(rand, e.fireworkDistance),
        size: between(rand, e.fireworkSize),
        color: i % 2 === 0 ? colors.nailedIt : colors.habit,
        delayMs,
      }));
    return [
      ...wave(e.fireworkFirstWave, 0, -90),
      ...wave(e.fireworkSecondWave, e.fireworkWaveGapMs, -90 + 180 / e.fireworkSecondWave),
    ];
  }

  return [];
}
