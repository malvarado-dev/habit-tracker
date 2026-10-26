import { describe, expect, it } from '@jest/globals';

import { activityBarLabel } from '@/components/activityBarText';
import { createInitialState, type TrackerState } from '@/features/tracker/state';
import { lockDays } from '@/rules/locking';
import {
  canOpenDay,
  dayCellLabel,
  dayBarLabel,
  dayStatusText,
  firstMonth,
  monthGrid,
  monthLimits,
  monthTitle,
  stepMonth,
  weekdayLetters,
} from './historyModel';

// Pretend dates: Monday 2026-10-19 is today. Oct 1 2026 is a Thursday.
const TODAY = '2026-10-19';
// Sleep, Diet, and Wellbeing are due every day: 2 of 3 fill the bar.
const filled = { sleep: 1, diet: 1 };
// Oct 15 was opened as a Rest day: a saved target of 0.
const REST_DAY = '2026-10-15';

function state(log: TrackerState['log']): TrackerState {
  return lockDays({ ...createInitialState(), log, targets: { [REST_DAY]: 0 } }, TODAY);
}

describe('month grid', () => {
  it('starts on Sunday, pads with other months, and has whole weeks', () => {
    const weeks = monthGrid('2026-10', state({}), TODAY);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]!.map((c) => c.date)[0]).toBe('2026-09-27');
    expect(weeks[0]!.slice(0, 4).every((c) => c.kind === 'outside')).toBe(true);
    expect(weeks[0]![4]!.date).toBe('2026-10-01');
    expect(weeks[4]!.at(-1)!.date).toBe('2026-10-31');
    expect(weekdayLetters()).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });

  it('marks today and future days; future days can not be opened', () => {
    const cells = monthGrid('2026-10', state({}), TODAY).flat();
    expect(cells.find((c) => c.isToday)?.date).toBe(TODAY);
    expect(cells.find((c) => c.date === '2026-10-20')?.kind).toBe('future');
    expect(canOpenDay('2026-10-20', TODAY)).toBe(false);
    expect(canOpenDay(TODAY, TODAY)).toBe(true);
  });

  it('shows the saved result for locked days and live results for open days', () => {
    const s = state({ '2026-10-14': filled, [TODAY]: { sleep: 1 } });
    const cells = monthGrid('2026-10', s, TODAY).flat();
    const at = (d: string) => cells.find((c) => c.date === d)!;
    expect(at('2026-10-14').result?.outcome).toBe('checkIn');
    expect(at(REST_DAY).result?.outcome).toBe('rest');
    expect(at('2026-10-16').result?.outcome).toBe('none');
    expect(at(TODAY).result).toEqual({ outcome: 'none', logs: 1, target: 2 });
  });
});

describe('screen reader labels', () => {
  const s = state({ '2026-10-14': filled });
  const cells = monthGrid('2026-10', s, TODAY).flat();
  const label = (d: string) => dayCellLabel(cells.find((c) => c.date === d)!);

  it('reads the date and Check-in, Rest day, or No check-in', () => {
    expect(label('2026-10-14')).toBe('Wed, Oct 14, Check-in');
    expect(label('2026-10-15')).toBe('Thu, Oct 15, Rest day');
    expect(label('2026-10-16')).toBe('Fri, Oct 16, No check-in');
  });
});

describe('month arrows', () => {
  const log: TrackerState['log'] = { '2026-09-03': { sleep: 1 } };

  it('can not go before the first month with data or past this month', () => {
    expect(firstMonth(log, TODAY)).toBe('2026-09');
    expect(monthLimits('2026-10', log, TODAY)).toEqual({ canPrev: true, canNext: false });
    expect(monthLimits('2026-09', log, TODAY)).toEqual({ canPrev: false, canNext: true });
    expect(stepMonth('2026-09', -1, log, TODAY)).toBe('2026-09');
    expect(stepMonth('2026-10', 1, log, TODAY)).toBe('2026-10');
    expect(stepMonth('2026-10', -1, log, TODAY)).toBe('2026-09');
  });

  it('with no data, only this month', () => {
    expect(monthLimits('2026-10', {}, TODAY)).toEqual({ canPrev: false, canNext: false });
    expect(monthTitle('2026-10')).toBe('October 2026');
  });
});

describe('acceptance: Day screen lock line (T24)', () => {
  // TODAY is a Monday in this file; the clock time is what counts down.
  const at = (h: number, m = 0) => new Date(2026, 9, 19, h, m);

  it('today counts down to the midnight 2 days out', () => {
    expect(dayStatusText(TODAY, TODAY, null, 2, at(10)).text).toBe('Habits lock in 62hrs');
  });

  it('yesterday and the day before count down too', () => {
    expect(dayStatusText('2026-10-18', TODAY, null, 2, at(10)).text).toBe('Habits lock in 38hrs');
    expect(dayStatusText('2026-10-17', TODAY, null, 2, at(10)).text).toBe('Habits lock in 14hrs');
  });

  it('the last hour shows minutes', () => {
    expect(dayStatusText('2026-10-17', TODAY, null, 2, at(23, 48)).text).toBe(
      'Habits lock in 12mins',
    );
    expect(dayStatusText('2026-10-17', TODAY, null, 2, at(23, 59)).text).toBe(
      'Habits lock in 1min',
    );
  });

  it('exactly one hour left reads 1hr', () => {
    expect(dayStatusText('2026-10-17', TODAY, null, 2, at(23)).text).toBe('Habits lock in 1hr');
  });

  it('older days in Real are locked', () => {
    expect(dayStatusText('2026-10-16', TODAY, null, 2, at(10))).toEqual({
      locked: true,
      text: 'Habits locked in',
    });
  });

  it('a saved lock wins over the window', () => {
    expect(dayStatusText('2026-10-17', TODAY, '2026-10-17', 2, at(10)).locked).toBe(true);
  });
});

describe('acceptance: Day screen bar label (T24)', () => {
  it('today reads Today', () => {
    expect(dayBarLabel(TODAY, TODAY, 'en-US')).toBe('Today');
  });

  it('another day this year reads like "Thu, Oct 15"', () => {
    expect(dayBarLabel('2026-10-15', TODAY, 'en-US')).toBe('Thu, Oct 15');
  });

  it('a day outside this year adds the year', () => {
    expect(dayBarLabel('2025-12-31', TODAY, 'en-US')).toBe('Wed, Dec 31, 2025');
  });

  it("follows the phone's region format", () => {
    expect(dayBarLabel('2026-10-15', TODAY, 'en-GB')).toBe('Thu 15 Oct');
  });

  it('screen readers hear the date in place of today', () => {
    expect(activityBarLabel(1, 2, false, 'on Thu, Oct 15')).toBe(
      'Activity Bar, 1 of 2 logs on Thu, Oct 15',
    );
  });
});
