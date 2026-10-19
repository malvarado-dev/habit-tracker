// The critter state and rank moment for one day (T15), kept out of the screen files. Today and
// the Day screen (T23) both use it, with the same rules.
// - woken: the critter wakes on a tap or any score, and falls back asleep when the app is
//   closed or a new day starts (critterMood decides when that matters: C and before check-in).
// - moment: plays tuning.celebrationDelayMs after the day is finished, and again only if a
//   later change raises the rank. Never on app open or on opening a day (rankToPlay, rankMoment.ts).
// - active: false while the screen is hidden under another one. Nothing wakes or plays then, and
//   on return anything finished meanwhile counts as played (playedOnReturn), so Today never
//   replays a day finished on the Day screen.

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { tuning } from '@/config/tuning';
import type { DateKey } from '@/rules/dates';
import type { Rank } from '@/rules/rank';
import { finishedRank, initialPlayed, playedOnReturn, rankToPlay } from '@/rules/rankMoment';
import type { DailyResult } from '@/rules/scoring';

import type { Moment } from './Critter';

export function useCritterAndMoment(
  result: DailyResult,
  day: DateKey,
  reactKey: string,
  active: boolean = true,
) {
  const [woken, setWoken] = useState(false);
  const [moment, setMoment] = useState<Moment | null>(null);
  const played = useRef<{ day: DateKey; rank: Rank | null }>({
    day,
    rank: initialPlayed(result),
  });
  const lastKey = useRef(reactKey);
  const lastDay = useRef(day);
  const latest = useRef(result);
  useEffect(() => {
    latest.current = result;
  });

  // A new day (Next day in Test tools, or another day picked on the Day screen): asleep again.
  // Opening a day that's already finished counts it as played, same as app open.
  useEffect(() => {
    if (lastDay.current === day) return;
    lastDay.current = day;
    lastKey.current = reactKey;
    played.current = { day, rank: initialPlayed(latest.current) };
    setWoken(false);
    setMoment(null);
  }, [day, reactKey]);

  // Back on screen: changes made while hidden don't wake or replay anything.
  useEffect(() => {
    if (!active) return;
    if (lastKey.current !== reactKey) {
      lastKey.current = reactKey;
      played.current = { day, rank: playedOnReturn(latest.current, played.current.rank) };
    }
    // Only on becoming active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Any score wakes the critter.
  useEffect(() => {
    if (!active || lastKey.current === reactKey) return;
    lastKey.current = reactKey;
    setWoken(true);
  }, [reactKey, active]);

  // Closing the app (or switching away) puts it back to sleep.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') setWoken(false);
    });
    return () => sub.remove();
  }, []);

  // The rank moment, after a short pause so quick re-taps don't fire it early. The timer
  // restarts only when a score changes (reactKey), never on an ordinary redraw.
  const finished = finishedRank(result);
  useEffect(() => {
    if (!finished || !active) return;
    const timer = setTimeout(() => {
      const rank = rankToPlay(latest.current, played.current.rank);
      if (!rank) return;
      played.current = { day, rank };
      setMoment({ rank, id: Date.now() });
    }, tuning.celebrationDelayMs);
    return () => clearTimeout(timer);
  }, [finished, reactKey, day, active]);

  return { woken, wake: () => setWoken(true), moment };
}
