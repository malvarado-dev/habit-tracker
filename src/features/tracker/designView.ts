// What the screens see under each bad habits design (P2-10). Design 2 reads every good habit as
// one tap and hides mirror bad habits. Only the view changes: the saved tracker keeps every
// frequency, bad habit, and slip, so switching back to Design 1 shows them all again.

import type { BadHabitDesign } from '@/rules/badHabits';
import { habitsForDesign } from '@/rules/design';
import { isMirrorBadHabit } from '@/features/habits/premadeHabits';
import type { TrackerState } from './state';

export function designView(state: TrackerState, design: BadHabitDesign): TrackerState {
  if (design === 'design1') return state;
  return {
    ...state,
    habits: habitsForDesign(state.habits, design),
    removed: habitsForDesign(state.removed, design),
    badHabits: state.badHabits.filter((b) => !isMirrorBadHabit(b)),
  };
}
