import { describe, expect, it } from '@jest/globals';
import {
  getDailyResult,
  getEnergy,
  isFreeSkip,
  nextCheckIn,
  type CheckInLog,
  type Habit,
} from './scoring';

const exercise: Habit = { id: 'exercise', name: 'Exercise', weeklyTarget: 3 };
const sleep: Habit = { id: 'sleep', name: 'Sleep', weeklyTarget: 7 };

// Week of Monday 2026-10-12 to Sunday 2026-10-18.
const MON = '2026-10-12';
const TUE = '2026-10-13';
const WED = '2026-10-14';
const THU = '2026-10-15';
const FRI = '2026-10-16';
const SAT = '2026-10-17';

describe('nextCheckIn (tap cycle)', () => {
  it('cycles On track, Nailed it, Not today, Started, then On track again', () => {
    expect(nextCheckIn(undefined)).toBe('OnTrack');
    expect(nextCheckIn('OnTrack')).toBe('NailedIt');
    expect(nextCheckIn('NailedIt')).toBe('NotToday');
    expect(nextCheckIn('NotToday')).toBe('Started');
    expect(nextCheckIn('Started')).toBe('OnTrack');
  });
});

describe('weekly target rule (SPEC-00 worked example: Exercise, 3 days a week)', () => {
  const log: CheckInLog = {
    [MON]: { exercise: 'NotToday' },
    [TUE]: { exercise: 'NailedIt' },
    [WED]: { exercise: 'NotToday' },
    [THU]: { exercise: 'NotToday' },
    [FRI]: { exercise: 'NotToday' },
    [SAT]: { exercise: 'NotToday' },
  };

  it.each([
    [MON, true],
    [WED, true],
    [THU, true],
    [FRI, true],
    [SAT, false],
  ])('Not today on %s is free: %s', (date, expected) => {
    expect(isFreeSkip(exercise, log, date)).toBe(expected);
  });

  it('a free skip leaves nothing to score, so the day is a Rest day', () => {
    const result = getDailyResult([exercise], log, FRI);
    expect(result.isRestDay).toBe(true);
    expect(result.score).toBeNull();
  });

  it('a skip that misses the target counts as 0 of 3', () => {
    const result = getDailyResult([exercise], log, SAT);
    expect(result).toMatchObject({ earnedStars: 0, possibleStars: 3, score: 0 });
    expect(result.isRestDay).toBe(false);
  });

  it('Not today is never free on a 7-day habit', () => {
    expect(isFreeSkip(sleep, {}, MON)).toBe(false);
  });
});

describe('collapsing once the weekly target is met', () => {
  const log: CheckInLog = {
    [MON]: { exercise: 'Started' },
    [TUE]: { exercise: 'OnTrack' },
    [WED]: { exercise: 'NailedIt' },
  };

  it('stays active on the day the target is reached', () => {
    expect(getDailyResult([exercise], log, WED).activeCount).toBe(1);
  });

  it('drops off the list for the rest of the week', () => {
    const result = getDailyResult([exercise, sleep], log, THU);
    expect(result.activeCount).toBe(1);
    expect(result.possibleStars).toBe(3);
  });

  it('comes back the next Monday', () => {
    expect(getDailyResult([exercise], log, '2026-10-19').activeCount).toBe(1);
  });

  it('a Not today day does not count toward the target', () => {
    const skipped: CheckInLog = { [MON]: { exercise: 'NotToday' } };
    expect(isFreeSkip(exercise, skipped, TUE)).toBe(true);
    expect(getDailyResult([exercise], skipped, TUE).activeCount).toBe(1);
  });
});

describe('getDailyResult', () => {
  const habits = [sleep, exercise];

  it('starts the day at zero with everything still possible', () => {
    const result = getDailyResult(habits, {}, MON);
    expect(result).toMatchObject({
      activeCount: 2,
      checkedInCount: 0,
      earnedStars: 0,
      possibleStars: 6,
      isComplete: false,
      score: 0,
    });
    expect(getEnergy(result)).toBe(0);
  });

  it('counts unscored habits as possible, so the score climbs as you check in', () => {
    const result = getDailyResult(habits, { [MON]: { sleep: 'NailedIt' } }, MON);
    expect(result.score).toBe(0.5);
    expect(getEnergy(result)).toBe(0.5);
  });

  it('a free skip is removed from the math entirely', () => {
    const result = getDailyResult(
      habits,
      { [MON]: { sleep: 'OnTrack', exercise: 'NotToday' } },
      MON,
    );
    expect(result).toMatchObject({ earnedStars: 2, possibleStars: 3, isComplete: true });
    expect(result.score).toBeCloseTo(2 / 3);
  });

  it('is complete only when every active habit has a check-in', () => {
    const result = getDailyResult(habits, { [MON]: { sleep: 'Started' } }, MON);
    expect(result.isComplete).toBe(false);
  });

  it('with no habits, the day is a complete Rest day with a full energy bar', () => {
    const result = getDailyResult([], {}, MON);
    expect(result.isRestDay).toBe(true);
    expect(getEnergy(result)).toBe(1);
  });
});
