// Today (SPEC-00). The Background and critter fill the screen with the habit sheet over the lower
// part on phone and tablet portrait; on wide, the sheet is on the left and the Background card
// sits above History on the right. The layout is shared with the Day screen (SceneLayout, T23).
// No header; the subtle menu button sits top left.

import { useIsFocused } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useState } from 'react';

import { HabitSheet } from '@/components/HabitSheet';
import { MenuButton } from '@/components/MenuButton';
import { pageTitle } from '@/components/pageTitle';
import { SceneLayout } from '@/components/SceneLayout';
import { SideMenu } from '@/components/SideMenu';
import { useAffectionPurr } from '@/components/useAffectionPurr';
import { useCritterWake } from '@/components/useCritterWake';
import { useExploreReveal } from '@/components/useExploreReveal';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getActivityBar } from '@/rules/activityBar';
import { isExploring } from '@/rules/explore';
import { allHabits, barLog } from '@/rules/locking';
import { hasHabitLog, petPlace } from '@/rules/petPlace';
import { petStats } from '@/rules/petStats';
import { getSkyLevel, getSkyTime } from '@/rules/sky';

/** The page title on the web build (#113). */
export function generateMetadata(): Metadata {
  return { title: pageTitle('index') };
}

export default function HomeScreen() {
  const { state, today } = useTracker();
  // Today stays loaded under the Day screen; the critter only wakes while it's on screen.
  const focused = useIsFocused();

  const bar = getActivityBar(allHabits(state), barLog(state), today, state.targets[today]);
  const skyLevel = getSkyLevel(bar);
  const skyTime = getSkyTime(new Date().getHours());
  const logKey = JSON.stringify([state.log[today], state.slips[today]]);
  const { woken, wake } = useCritterWake(today, logKey, focused);

  const stats = petStats(state);
  const awake = hasHabitLog(state.log, today);
  useAffectionPurr(stats.love, awake, focused);
  useExploreReveal(focused);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SceneLayout
      testID="today-screen"
      critter={{ level: skyLevel, woken, onWake: wake, time: skyTime }}
      pet={petPlace(stats.confidence, awake)}
      exploring={isExploring(state.explore, today)}
      corner={(onPage) => (
        <MenuButton time={skyTime} onPage={onPage} onPress={() => setMenuOpen(true)} />
      )}
      sheet={(bottomPadding) => <HabitSheet bottomPadding={bottomPadding} />}
      overlay={<SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    />
  );
}
