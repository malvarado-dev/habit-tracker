// Explore (P2-16, #87, PRD-14): a full bar lets you send the pet out once a day. It explores the
// neighborhood until midnight; the first open after that reveals the Coins it found and brings it
// home. Coins are worked out from the days it was sent, like log Coins (coins.ts), so a reward
// can't be paid twice. Each day's amount is picked from the date, so reopening can't reroll it.
// Plain TypeScript, no screens.

import { tuning } from '@/config/tuning';
import type { DateKey } from './dates';

export interface ExploreState {
  /** Days the pet was sent exploring, oldest first. */
  sent: DateKey[];
  /** The newest explore day whose reward was shown. Null until the first reveal. */
  seenThrough: DateKey | null;
}

export const START_EXPLORE: ExploreState = { sent: [], seenThrough: null };

type Explore = typeof tuning.explore;

/** The pet is out exploring today. */
export const isExploring = (e: ExploreState, today: DateKey) => e.sent.includes(today);

/** The Explore button: the bar is full today and the pet hasn't been sent yet. */
export const canExplore = (e: ExploreState, today: DateKey, barFull: boolean) =>
  barFull && !isExploring(e, today);

/** A small hash of the date, so each day's reward is random but always the same. */
function dayHash(date: DateKey): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Coins the pet finds on a day's exploring. */
export function exploreReward(date: DateKey, x: Explore = tuning.explore): number {
  return x.coinsMin + Math.floor(dayHash(date) * (x.coinsMax - x.coinsMin + 1));
}

/** Coins from every finished exploring day (before today). Today's pet is still out. */
export function exploreCoins(e: ExploreState, today: DateKey, x: Explore = tuning.explore): number {
  return e.sent.filter((d) => d < today).reduce((sum, d) => sum + exploreReward(d, x), 0);
}

/** The newest finished explore day whose reward hasn't been shown yet, or null. */
export function rewardToReveal(e: ExploreState, today: DateKey): DateKey | null {
  const done = e.sent.filter((d) => d < today);
  const last = done[done.length - 1];
  if (last === undefined) return null;
  return e.seenThrough !== null && e.seenThrough >= last ? null : last;
}

export type LayerName = 'near' | 'mid' | 'far';

export interface ExploreLayout {
  /** Screen points per art pixel. */
  scale: number;
  /** One layer tile's width on screen. */
  tileWidth: number;
  /** Tiles side by side so the screen is always covered while one scrolls off. */
  copies: number;
  /** Top of each layer on screen (the far layer sits higher). */
  top: Record<LayerName, number>;
  /** Layer height on screen. */
  height: number;
  /** Where the pet's paws touch the path. */
  pathY: number;
  /** Time for one tile to scroll past, per layer: near fastest, far slowest. */
  loopMs: Record<LayerName, number>;
}

/** Fits the layers to the scene's height and works out each layer's loop. */
export function exploreLayout(
  width: number,
  sceneHeight: number,
  x: Explore = tuning.explore,
): ExploreLayout {
  const [w, h] = x.layerSize;
  const scale = sceneHeight / (h + x.farRaise);
  const tileWidth = w * scale;
  const copies = Math.ceil(width / Math.max(tileWidth, 1)) + 1;
  const raise = x.farRaise * scale;
  const loop = (speed: number) => (tileWidth / speed) * 1000;
  return {
    scale,
    tileWidth,
    copies,
    top: { far: 0, mid: raise, near: raise },
    height: h * scale,
    pathY: raise + x.pathY * scale,
    loopMs: { near: loop(x.speeds.near), mid: loop(x.speeds.mid), far: loop(x.speeds.far) },
  };
}

export type ExploreTint = { color: string; opacity: number };

/** The layers' tint for the sky's time of day: none by day, darker and bluer later. */
export function exploreTint(
  time: 'day' | 'dusk' | 'night',
  x: Explore = tuning.explore,
): ExploreTint {
  return x.tint[time];
}
