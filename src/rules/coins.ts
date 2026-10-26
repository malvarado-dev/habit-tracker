// Coins from logs (PRD-15 Scoring, P2-08c). Every habit card log earns Coins, gold or a linked
// slip (slate). Standalone slips earn nothing: they only track. Only the first few logs per habit
// per day count, and a full Activity Bar changes nothing, so logs past it still earn.
//
// Coins are worked out from the logs every time, never kept as a running total. That's what makes
// Undo take them back and a past-day fix earn exactly once per log: there's nothing to drift out
// of step. When Coins can be spent, spending will be its own record and the balance will be
// earned minus spent. Plain TypeScript, no screens.

import { tuning } from '@/config/tuning';
import type { BadHabit, SlipCounts } from './badHabits';
import type { DateKey } from './dates';
import type { Habit, LogCounts } from './habits';
import { withLinkedSlips } from './linked';

export interface CoinRules {
  perLog: number;
  logsPerHabitPerDay: number;
  dailyCap: number | null;
}

const DEFAULT_RULES: CoinRules = tuning.coins;

export interface CoinSource {
  /** Every habit, active and removed, so a removed habit's earlier logs keep their Coins. */
  habits: Habit[];
  log: LogCounts;
  slips: SlipCounts;
  badHabits: BadHabit[];
}

/** Coins one day's logs earn. */
export function dayCoins(
  source: CoinSource,
  date: DateKey,
  rules: CoinRules = DEFAULT_RULES,
): number {
  const day = withLinkedSlips(
    source.habits,
    pick(source.log, date),
    pick(source.slips, date),
    source.badHabits,
  )[date];
  return coinsForDay(day, rules);
}

/** Every Coin earned from logs, all days. */
export function totalCoins(source: CoinSource, rules: CoinRules = DEFAULT_RULES): number {
  const all = withLinkedSlips(source.habits, source.log, source.slips, source.badHabits);
  return Object.values(all).reduce((sum, day) => sum + coinsForDay(day, rules), 0);
}

function coinsForDay(day: Record<string, number> | undefined, rules: CoinRules): number {
  if (!day) return 0;
  const logs = Object.values(day).reduce(
    (sum, n) => sum + Math.min(Math.max(0, n), rules.logsPerHabitPerDay),
    0,
  );
  const coins = logs * rules.perLog;
  return rules.dailyCap === null ? coins : Math.min(coins, rules.dailyCap);
}

function pick<T>(byDate: Record<DateKey, T>, date: DateKey): Record<DateKey, T> {
  return byDate[date] === undefined ? {} : { [date]: byDate[date] };
}
