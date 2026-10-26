// Explore (P2-16): the first time Today shows after an exploring day, the narrator says what the
// pet found and the reward is marked as shown, so it's said once. The Coins themselves come from
// the explore days (rules/explore.ts), so they're in the balance either way.

import { useEffect } from 'react';

import { useTracker } from '@/features/tracker/TrackerProvider';
import { exploreReward, rewardToReveal } from '@/rules/explore';
import { announce } from '@/scene/petMoments';

export function useExploreReveal(focused: boolean): void {
  const { state, today, dispatch } = useTracker();
  const day = rewardToReveal(state.explore, today);
  useEffect(() => {
    if (!focused || day === null) return;
    dispatch({ type: 'markExploreSeen', date: day });
    announce(`Neko found ${exploreReward(day)} Coins.`);
  }, [focused, day, dispatch]);
}
