// Love over 30: the pet purrs at you once per app open (P2-14, #85, PRD-09). If it's asleep, it
// waits until the first log wakes it, so the purr plays right after the wake reaction.

import { useEffect } from 'react';

import { affectionDue } from '@/rules/payoff';
import { requestPetMoment } from '@/scene/petMoments';

/** Once per app open: reset only when the app starts again. */
let shownThisOpen = false;

export function useAffectionPurr(love: number, awake: boolean, focused: boolean): void {
  useEffect(() => {
    if (!focused || !affectionDue(love, { shownThisOpen, awake })) return;
    shownThisOpen = true;
    requestPetMoment({ kind: 'purr' });
  }, [love, awake, focused]);
}
