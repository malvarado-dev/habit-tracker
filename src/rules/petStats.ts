// The pet's Love and Confidence (P2-13, #84, PRD-09 Progression and thresholds). Both are worked
// out from the log every time, never added up as you tap, so undoing a log or fixing a past day
// in History always corrects them and tapping on and off can't farm points.
//
// Earned per day: each completed habit adds to its linked stat, and each Activity Bar notch the
// day passed adds to both. A habit's stat comes from its premade category, matched by name;
// custom or renamed habits use the custom stat. Only gold logs complete a habit for stats, so a
// slip never grows the pet; notches follow the bar as shown (gold logs plus linked slips).
// Quests will be the main driver later. These numbers are starting values for testing.
//
// Plain TypeScript, no screens. Every number lives in tuning.pet.stats.

import { tuning } from '@/config/tuning';
import { PREMADE_HABITS, type HabitCategory } from '@/features/habits/premadeHabits';
import { nameKey } from '@/features/habits/habitName';
import { getActivityBar } from './activityBar';
import type { DateKey } from './dates';
import { existsOn, timesPerDay, type Habit, type LogCounts } from './habits';
import { allHabits, barLog, type LockState } from './locking';

export type PetStat = 'love' | 'confidence';

export interface PetStats {
  love: number;
  confidence: number;
}

/** Test tools nudges on top of the worked-out values. Real saves keep these at 0. */
export interface PetAdjust {
  loveAdjust: number;
  confidenceAdjust: number;
}

export const MIN_STAT = 0;
export const MAX_STAT = 100;

type Stats = typeof tuning.pet.stats;

const clamp = (n: number) => Math.min(MAX_STAT, Math.max(MIN_STAT, Math.round(n)));

/** The stat a habit category raises. */
export function statForCategory(category: HabitCategory, s: Stats = tuning.pet.stats): PetStat {
  return s.byCategory[category];
}

/** The stat a habit raises: its premade category by name, or the custom stat. */
export function statForHabit(habit: Pick<Habit, 'name'>, s: Stats = tuning.pet.stats): PetStat {
  const key = nameKey(habit.name);
  const premade = PREMADE_HABITS.find((p) => nameKey(p.name) === key);
  return premade ? statForCategory(premade.category, s) : s.customHabit;
}

/** Notches the day's bar passed. A Rest day has nothing to pass. */
export function notchesPassed(
  habits: Habit[],
  log: LogCounts,
  date: DateKey,
  savedTarget?: number,
): number {
  const bar = getActivityBar(habits, log, date, savedTarget);
  if (bar.isRestDay) return 0;
  return tuning.activityBar.notches.filter((at) => bar.fill >= at - 1e-9).length;
}

/** Love and Confidence earned from every logged day, before the start value and caps. */
export function earnedStats(state: LockState, s: Stats = tuning.pet.stats): PetStats {
  const habits = allHabits(state);
  const bar = barLog(state);
  const earned: PetStats = { love: 0, confidence: 0 };
  for (const date of Object.keys(bar)) {
    const gold = state.log[date] ?? {};
    for (const habit of habits) {
      if (!existsOn(habit, date)) continue;
      if ((gold[habit.id] ?? 0) >= timesPerDay(habit)) earned[statForHabit(habit, s)] += s.perHabit;
    }
    const notches = notchesPassed(habits, bar, date, state.targets[date]);
    earned.love += notches * s.perNotch;
    earned.confidence += notches * s.perNotch;
  }
  return earned;
}

/** The pet's Love and Confidence now: start value, plus earned, plus any test nudge, 0 to 100. */
export function petStats(
  state: LockState & { pet: PetAdjust },
  s: Stats = tuning.pet.stats,
): PetStats {
  const earned = earnedStats(state, s);
  return {
    love: clamp(s.startLove + earned.love + state.pet.loveAdjust),
    confidence: clamp(s.startConfidence + earned.confidence + state.pet.confidenceAdjust),
  };
}

/** The nudge that makes a stat show `value` (clamped), given what the log earns. */
export function adjustFor(
  stat: PetStat,
  value: number,
  state: LockState,
  s: Stats = tuning.pet.stats,
): number {
  const start = stat === 'love' ? s.startLove : s.startConfidence;
  const target = Number.isFinite(value) ? clamp(value) : start;
  return target - start - earnedStats(state, s)[stat];
}
