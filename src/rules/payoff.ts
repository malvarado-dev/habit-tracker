// The Activity Bar payoff (P2-14, #85): what reacts when the bar moves, which moment a full bar
// plays, and each moment's timeline. Plain TypeScript, no screens. Every number lives in
// tuning.pet.moments.
//
// Moments are visual only: stats already come from notches (P2-13), so replaying one after an
// undo and refill never pays twice.

import { tuning } from '@/config/tuning';
import type { DateKey } from './dates';
import { existsOn, timesPerDay, type Habit, type LogCounts } from './habits';

export type MomentKind = 'eat' | 'pounce' | 'purr';
export const MOMENT_KINDS: readonly MomentKind[] = ['eat', 'pounce', 'purr'];

/** Every pet moment with a timeline: the bar's three, plus a quest's claim celebration (P2-15). */
export type PetMomentKind = MomentKind | 'celebrate';

/** Returns a number from 0 up to (not including) 1, like Math.random. */
export type Rand = () => number;

type Moments = typeof tuning.pet.moments;

/** One of the three moments, evenly. */
export function pickMoment(rand: Rand): MomentKind {
  const i = Math.min(MOMENT_KINDS.length - 1, Math.floor(rand() * MOMENT_KINDS.length));
  return MOMENT_KINDS[i]!;
}

/** Habits finished on a day (its count reached its times per day), for the caption. */
export function finishedCount(habits: Habit[], log: LogCounts, date: DateKey): number {
  const day = log[date] ?? {};
  return habits.filter((h) => existsOn(h, date) && (day[h.id] ?? 0) >= timesPerDay(h)).length;
}

/** The full-bar caption (placeholder lines, PRD-09 narrator). */
export function momentCaption(kind: MomentKind, finished: number, petName = 'Neko'): string {
  const did = `You finished ${finished} ${finished === 1 ? 'habit' : 'habits'}.`;
  if (kind === 'eat') return `${did} ${petName} ate every bite.`;
  if (kind === 'pounce') return `${did} ${petName} pounced on the toy.`;
  return `${did} ${petName} is purring.`;
}

/** Love over this purrs at you once per app open, while awake (PRD-09). */
export function affectionDue(
  love: number,
  { shownThisOpen, awake }: { shownThisOpen: boolean; awake: boolean },
  m: Moments = tuning.pet.moments,
): boolean {
  return !shownThisOpen && awake && love > m.affectionLoveAbove;
}

export interface MomentPlan {
  /** Windows (start and end, ms) with the eyes closed. */
  eyesShut: [number, number][];
  /** When each heart starts (ms). */
  hearts: number[];
  /** A prop that comes in, and when it leaves (ms). */
  prop?: { kind: 'bowl' | 'toy'; inMs: number; outAt: number };
  /** When the reaction hop starts (ms). Never with reduced motion. */
  hopAt?: number;
  /** Hearts and props move, or (reduced motion) only fade in place. */
  moves: boolean;
  /** When the next moment may start (ms). */
  totalMs: number;
}

/** A moment's timeline. Reduced motion keeps the eyes and hearts but drops all movement. */
export function momentPlan(
  kind: PetMomentKind,
  { reduceMotion, hopMs }: { reduceMotion: boolean; hopMs: number },
  m: Moments = tuning.pet.moments,
): MomentPlan {
  const moves = !reduceMotion;
  if (kind === 'celebrate') {
    // A purr with a burst of hearts, closer together (tuning.quest.heal).
    const c = tuning.quest.heal;
    const gap = m.heartMs * c.celebrateHeartOverlap;
    const hearts = Array.from({ length: c.celebrateHearts }, (_, i) => i * gap);
    const end = hearts[hearts.length - 1]! + m.heartMs;
    return { eyesShut: [[0, end]], hearts, moves, totalMs: end + m.restMs };
  }
  if (kind === 'purr') {
    const gap = m.heartMs * m.purrHeartOverlap;
    const hearts = Array.from({ length: m.purrHearts }, (_, i) => i * gap);
    const end = hearts[hearts.length - 1]! + m.heartMs;
    return { eyesShut: [[0, end]], hearts, moves, totalMs: end + m.restMs };
  }
  if (kind === 'eat') {
    const thanks = m.bowlInMs + m.thanksDelayMs;
    const out = thanks + m.thanksMs + m.propHoldMs;
    return {
      eyesShut: [[thanks, thanks + m.thanksMs]],
      hearts: [thanks],
      prop: { kind: 'bowl', inMs: m.bowlInMs, outAt: out },
      moves,
      totalMs: out + m.propOutMs + m.restMs,
    };
  }
  const hopAt = m.toyInMs + m.thanksDelayMs;
  const thanks = (moves ? hopAt + hopMs : m.toyInMs) + m.thanksDelayMs;
  const out = thanks + m.thanksMs + m.propHoldMs;
  return {
    eyesShut: [[thanks, thanks + m.thanksMs]],
    hearts: [thanks],
    prop: { kind: 'toy', inMs: m.toyInMs, outAt: out },
    ...(moves ? { hopAt } : {}),
    moves,
    totalMs: out + m.propOutMs + m.restMs,
  };
}
