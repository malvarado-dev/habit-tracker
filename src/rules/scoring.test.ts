import { describe, expect, it } from '@jest/globals';
import {
  EVERY_DAY,
  getDailyResult,
  getEnergy,
  getWeekProgress,
  isDue,
  nextCheckIn,
  type CheckInLog,
  type Habit,
} from './scoring';

const sleep: Habit = {
  id: 'sleep',
  name: 'Sleep',
  goal: { kind: 'specificDays', days: EVERY_DAY },
  color: 'habit1',
};
const exercise: Habit = {
  id: 'exercise',
  name: 'Exercise',
  goal: { kind: 'anyDays', timesPerWeek: 3 },
  color: 'habit1',
};
// SPEC-00 worked example: Run, Specific days Mon, Wed, Fri (weekly goal 3).
const run: Habit = {
  id: 'run',
  name: 'Run',
  goal: { kind: 'specificDays', days: [0, 2, 4] },
  color: 'habit1',
};

// Week of Monday 2026-10-12 to Sunday 2026-10-18.
const MON = '2026-10-12';
const TUE = '2026-10-13';
const WED = '2026-10-14';
const THU = '2026-10-15';
const FRI = '2026-10-16';
const SAT = '2026-10-17';
const SUN = '2026-10-18';
const NEXT_MON = '2026-10-19';

describe('nextCheckIn (tap cycle)', () => {
  it('counts up from To do, then Skip, then back to To do', () => {
    expect(nextCheckIn(undefined)).toBe('Started');
    expect(nextCheckIn('Started')).toBe('OnTrack');
    expect(nextCheckIn('OnTrack')).toBe('NailedIt');
    expect(nextCheckIn('NailedIt')).toBe('NotToday');
    expect(nextCheckIn('NotToday')).toBeUndefined();
  });
});

describe('SPEC-00 worked example: Run, Mon Wed Fri, weekly goal 3', () => {
  const log: CheckInLog = {
    [MON]: { run: 'NotToday' },
    [TUE]: { run: 'NailedIt' },
    [WED]: { run: 'NailedIt' },
    [FRI]: { run: 'NotToday' },
  };

  it.each([
    // day, due, score (null = not counted or not asked), progress dots done
    [MON, true, null, 0],
    [TUE, false, 1, 1],
    [WED, true, 1, 2],
    [THU, false, null, 2],
    [FRI, true, null, 2],
    [SAT, false, null, 2],
    [SUN, false, null, 2],
  ])('%s: due %s, score %s, %s of 3', (day, due, score, done) => {
    expect(isDue(run, log, day)).toBe(due);
    expect(getDailyResult([run], log, day).score).toBe(score);
    expect(getWeekProgress(run, log, day)).toEqual({ done, goal: 3 });
  });

  it('Skip on a due day is not counted, so the day is a Rest day with no rank', () => {
    expect(getDailyResult([run], log, MON)).toMatchObject({ isRestDay: true, score: null });
  });

  it('a non-due day with an optional score gets a rank from that score', () => {
    expect(getDailyResult([run], log, TUE)).toMatchObject({ isRestDay: false, score: 1 });
  });
});

describe('due days', () => {
  it('an Any days habit is never due', () => {
    for (const day of [MON, TUE, WED, THU, FRI, SAT, SUN]) {
      expect(isDue(exercise, {}, day)).toBe(false);
    }
  });

  it('a Specific days habit stops being due once its goal is met on earlier days', () => {
    const met: CheckInLog = {
      [MON]: { run: 'Started' },
      [TUE]: { run: 'OnTrack' },
      [WED]: { run: 'NailedIt' },
    };
    expect(isDue(run, met, FRI)).toBe(false);
  });

  it('a met goal keeps the habit scorable, and it still counts toward progress', () => {
    const met: CheckInLog = {
      [MON]: { run: 'Started' },
      [TUE]: { run: 'OnTrack' },
      [WED]: { run: 'NailedIt' },
      [FRI]: { run: 'NailedIt' },
    };
    expect(getDailyResult([run], met, FRI).score).toBe(1);
    expect(getWeekProgress(run, met, FRI)).toEqual({ done: 4, goal: 3 });
  });

  it('progress resets the next Monday', () => {
    const log: CheckInLog = { [MON]: { run: 'NailedIt' } };
    expect(getWeekProgress(run, log, NEXT_MON)).toEqual({ done: 0, goal: 3 });
    expect(isDue(run, log, NEXT_MON)).toBe(true);
  });

  it('Skip never fills a progress dot', () => {
    expect(getWeekProgress(run, { [MON]: { run: 'NotToday' } }, MON)).toEqual({ done: 0, goal: 3 });
  });
});

describe('getDailyResult', () => {
  const habits = [sleep, exercise];

  it('starts the day at zero with every due habit still possible', () => {
    const result = getDailyResult(habits, {}, MON);
    expect(result).toMatchObject({
      dueCount: 1,
      checkedInCount: 0,
      earnedStars: 0,
      possibleStars: 3,
      isComplete: false,
      score: 0,
    });
    expect(getEnergy(result)).toBe(0);
  });

  it('Skip on a due habit is removed from the math and never lowers the rank', () => {
    const result = getDailyResult(
      [sleep, { ...sleep, id: 'diet', name: 'Diet' }],
      { [MON]: { sleep: 'NailedIt', diet: 'NotToday' } },
      MON,
    );
    expect(result).toMatchObject({ earnedStars: 3, possibleStars: 3, score: 1 });
  });

  it('an optional score can raise the day', () => {
    const result = getDailyResult(
      habits,
      { [MON]: { sleep: 'Started', exercise: 'NailedIt' } },
      MON,
    );
    // Due alone is 1 of 3. With the optional Nailed it, 4 of 6.
    expect(result.score).toBeCloseTo(4 / 6);
  });

  it('an optional score can never lower the day', () => {
    const result = getDailyResult(
      habits,
      { [MON]: { sleep: 'NailedIt', exercise: 'Started' } },
      MON,
    );
    expect(result).toMatchObject({ score: 1, earnedStars: 3, possibleStars: 3 });
  });

  it('is complete only when every due habit has a check-in', () => {
    expect(getDailyResult(habits, { [MON]: { exercise: 'NailedIt' } }, MON).isComplete).toBe(false);
    expect(getDailyResult(habits, { [MON]: { sleep: 'Started' } }, MON).isComplete).toBe(true);
  });

  it('nothing due and nothing scored is a Rest day with a full Energy bar', () => {
    const result = getDailyResult([exercise], {}, MON);
    expect(result).toMatchObject({ isRestDay: true, score: null, dueCount: 0 });
    expect(getEnergy(result)).toBe(1);
  });
});

describe('Energy bar follows stars', () => {
  const diet = { ...sleep, id: 'diet', name: 'Diet' };

  it('each star moves the bar, and 3 stars on everything fills it', () => {
    expect(
      getEnergy(getDailyResult([sleep, diet], { [MON]: { sleep: 'Started' } }, MON)),
    ).toBeCloseTo(1 / 6);
    expect(
      getEnergy(getDailyResult([sleep, diet], { [MON]: { sleep: 'OnTrack' } }, MON)),
    ).toBeCloseTo(2 / 6);
    expect(
      getEnergy(
        getDailyResult([sleep, diet], { [MON]: { sleep: 'NailedIt', diet: 'NailedIt' } }, MON),
      ),
    ).toBe(1);
  });

  it('Skip drops a habit from what is possible', () => {
    const result = getDailyResult(
      [sleep, diet],
      { [MON]: { sleep: 'NailedIt', diet: 'NotToday' } },
      MON,
    );
    expect(getEnergy(result)).toBe(1);
  });

  it('an optional score can only raise the bar', () => {
    const result = getDailyResult(
      [sleep, diet, exercise],
      { [MON]: { sleep: 'NotToday', exercise: 'NailedIt' } },
      MON,
    );
    expect(getEnergy(result)).toBe(0.5);
  });
});
