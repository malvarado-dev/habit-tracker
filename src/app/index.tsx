// Today (SPEC-00). The Background and critter fill the screen with the habit sheet over the lower
// part on phone and tablet portrait; on wide, the sheet is on the left and the Background card
// sits above History on the right. The layout is shared with the Day screen (SceneLayout, T23).
// No header; the subtle menu button sits top left.

import { router, useIsFocused } from 'expo-router';
import { useState } from 'react';

import { HabitSheet } from '@/components/HabitSheet';
import { MenuButton } from '@/components/MenuButton';
import { SceneLayout } from '@/components/SceneLayout';
import { SideMenu } from '@/components/SideMenu';
import { useCritterWake } from '@/components/useCritterWake';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getActivityBar } from '@/rules/activityBar';
import { allHabits } from '@/rules/locking';
import { getSkyLevel, getSkyTime } from '@/rules/sky';

export default function HomeScreen() {
  const { state, today } = useTracker();
  // Today stays loaded under the Day screen; the critter only wakes while it's on screen.
  const focused = useIsFocused();

  const bar = getActivityBar(allHabits(state), state.log, today, state.targets[today]);
  const skyLevel = getSkyLevel(bar);
  const skyTime = getSkyTime(new Date().getHours());
  const logKey = JSON.stringify(state.log[today] ?? {});
  const { woken, wake } = useCritterWake(today, logKey, focused);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SceneLayout
      testID="today-screen"
      critter={{ level: skyLevel, woken, onWake: wake, time: skyTime }}
      corner={(onPage) => (
        <MenuButton time={skyTime} onPage={onPage} onPress={() => setMenuOpen(true)} />
      )}
      sheet={(bottomPadding) => <HabitSheet bottomPadding={bottomPadding} />}
      onOpenDay={(date) =>
        router.push({ pathname: '/day/[date]', params: { date, from: 'today' } })
      }
      overlay={<SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    />
  );
}
