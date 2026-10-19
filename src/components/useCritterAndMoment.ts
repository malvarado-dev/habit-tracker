// Today's critter state and rank moment (T15), kept out of the screen file.
// - woken: the critter wakes on a tap or any score, and falls back asleep when the app is
//   closed or a new day starts (critterMood decides when that matters: C and before check-in).
// - moment: plays tuning.celebrationDelayMs after the day is finished, and again only if a
//   later change raises the rank. Never on app open (rankToPlay, rankMoment.ts).

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { tuning } from '@/config/tuning';
import type { DateKey } from '@/rules/dates';
import type { Rank } from '@/rules/rank';
import { finishedRank, initialPlayed, rankToPlay } from '@/rules/rankMoment';
import type { DailyResult } from '@/rules/scoring';

import type { Moment } from './Critter';

export function useCritterAndMoment(result: DailyResult, today: DateKey, reactKey: string) {
  const [woken, setWoken] = useState(false);
  const [moment, setMoment] = useState<Moment | null>(null);
  const played = useRef<{ day: DateKey; rank: Rank | null }>({
    day: today,
    rank: initialPlayed(result),
  });
  const lastKey = useRef(reactKey);
  const lastDay = useRef(today);

  // A new day (or Next day in Test tools): asleep again, nothing celebrated yet.
  useEffect(() => {
    if (lastDay.current === today) return;
    lastDay.current = today;
    lastKey.current = reactKey;
    played.current = { day: today, rank: null };
    setWoken(false);
    setMoment(null);
  }, [today, reactKey]);

  // Any score wakes the critter.
  useEffect(() => {
    if (lastKey.current === reactKey) return;
    lastKey.current = reactKey;
    setWoken(true);
  }, [reactKey]);

  // Closing the app (or switching away) puts it back to sleep.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') setWoken(false);
    });
    return () => sub.remove();
  }, []);

  // The rank moment, after a short pause so quick re-taps don't fire it early. The timer
  // restarts only when a score changes (reactKey), never on an ordinary redraw.
  const latest = useRef(result);
  useEffect(() => {
    latest.current = result;
  });
  const finished = finishedRank(result);
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => {
      const rank = rankToPlay(latest.current, played.current.rank);
      if (!rank) return;
      played.current = { day: today, rank };
      setMoment({ rank, id: Date.now() });
    }, tuning.celebrationDelayMs);
    return () => clearTimeout(timer);
  }, [finished, reactKey, today]);

  return { woken, wake: () => setWoken(true), moment };
}
