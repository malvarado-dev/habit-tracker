// The Heal Neko quest (P2-15, #86, PRD-14 Quests): the first Main Quest. It's available from the
// start and starts counting when you accept it. Progress is check-in days: days with a full
// Activity Bar on or after the accept day, the accept day included, and past days filled through
// History count too. Claim at the goal: the bandages come off and the reward is added to the
// worked-out stats (petStats.ts) once. Plain TypeScript, no screens.

import { tuning } from '@/config/tuning';
import { addDays, type DateKey } from './dates';
import { historyDay, type LockState } from './locking';

export interface HealQuest {
  /** The day you tapped Accept. Null until then. */
  acceptedOn: DateKey | null;
  /** The day you tapped Claim. Null until then. */
  claimedOn: DateKey | null;
  /** Test tools only: check-in days added on top of the real count, to jump ahead. */
  testBonus?: number;
}

export interface QuestState {
  heal: HealQuest;
}

export const START_QUESTS: QuestState = { heal: { acceptedOn: null, claimedOn: null } };

export type HealStatus = 'new' | 'active' | 'done' | 'claimed';

type Quest = typeof tuning.quest.heal;

/** Full-bar days from the accept day through today, plus any Test tools bonus, up to the goal. */
export function healCheckIns(
  state: LockState & { quests: QuestState },
  today: DateKey,
  q: Quest = tuning.quest.heal,
): number {
  const { acceptedOn, testBonus = 0 } = state.quests.heal;
  if (acceptedOn === null || acceptedOn > today) return 0;
  let count = 0;
  for (let date = acceptedOn; date <= today; date = addDays(date, 1)) {
    if (historyDay(state, date).outcome === 'checkIn') count++;
  }
  return Math.max(0, Math.min(q.goal, count + testBonus));
}

export function healStatus(
  state: LockState & { quests: QuestState },
  today: DateKey,
  q: Quest = tuning.quest.heal,
): HealStatus {
  const { acceptedOn, claimedOn } = state.quests.heal;
  if (claimedOn !== null) return 'claimed';
  if (acceptedOn === null) return 'new';
  return healCheckIns(state, today, q) >= q.goal ? 'done' : 'active';
}

/** The pet wears its bandages until the quest is claimed. */
export const isBandaged = (quests: QuestState) => quests.heal.claimedOn === null;

/** Love and Confidence the quest adds once claimed (PRD-09: quests drive stats). */
export function questStatBonus(
  quests: QuestState | undefined,
  q: Quest = tuning.quest.heal,
): { love: number; confidence: number } {
  return quests?.heal.claimedOn
    ? { love: q.rewardLove, confidence: q.rewardConfidence }
    : { love: 0, confidence: 0 };
}

/** The bonus that makes the count show `count` (Test tools stepper), given the real check-ins. */
export function testBonusFor(
  count: number,
  state: LockState & { quests: QuestState },
  today: DateKey,
  q: Quest = tuning.quest.heal,
): number {
  const target = Math.max(0, Math.min(q.goal, Math.round(count)));
  const real = healCheckIns(
    { ...state, quests: { heal: { ...state.quests.heal, testBonus: 0 } } },
    today,
    q,
  );
  return target - real;
}
