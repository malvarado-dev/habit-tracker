import { describe, expect, it } from '@jest/globals';
import { createInitialState, type TrackerState } from '@/features/tracker/state';
import { lockDays } from '@/rules/locking';
import {
  canOpenDay,
  dayCellLabel,
  dayStatusText,
  firstMonth,
  monthGrid,
  monthLimits,
  monthTitle,
  stepMonth,
  weekdayLetters,
  weekRows,
  weekTitle,
} from './historyModel';

// Pretend dates: Monday 2026-10-19 is today. Oct 1 2026 is a Thursday.
const TODAY = '2026-10-19';
const nailed = { sleep: 'NailedIt', diet: 'NailedIt', wellbeing: 'NailedIt' } as const;
const rest = { sleep: 'NotToday', diet: 'NotToday', wellbeing: 'NotToday' } as const;

function state(log: TrackerState['log']): TrackerState {
  return lockDays({ ...createInitialState(), log }, TODAY);
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
    const s = state({ '2026-10-14': nailed, '2026-10-15': rest, [TODAY]: { sleep: 'Started' } });
    const cells = monthGrid('2026-10', s, TODAY).flat();
    const at = (d: string) => cells.find((c) => c.date === d)!;
    expect(at('2026-10-14').result).toMatchObject({ outcome: 'rank', rank: 'S' });
    expect(at('2026-10-15').result?.outcome).toBe('rest');
    expect(at('2026-10-16').result?.outcome).toBe('none');
    expect(at(TODAY).result).toMatchObject({ outcome: 'rank', rank: 'C' });
  });
});

describe('screen reader labels', () => {
  const s = state({ '2026-10-14': nailed, '2026-10-15': rest });
  const cells = monthGrid('2026-10', s, TODAY).flat();
  const label = (d: string) => dayCellLabel(cells.find((c) => c.date === d)!);

  it('reads the date and the rank, Rest day, or No check-in', () => {
    expect(label('2026-10-14')).toBe('Wed, Oct 14, S rank');
    expect(label('2026-10-15')).toBe('Thu, Oct 15, Rest day');
    expect(label('2026-10-16')).toBe('Fri, Oct 16, No check-in');
  });
});

describe('month arrows', () => {
  const log = { '2026-09-03': { sleep: 'Started' } } as TrackerState['log'];

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

describe('Day screen status line', () => {
  it('open days say when they lock, using the real date', () => {
    expect(dayStatusText('2026-10-17', TODAY, null).text).toBe(
      'You can change this day until tonight',
    );
    expect(dayStatusText('2026-10-18', TODAY, null).text).toBe(
      'You can change this day until tomorrow night',
    );
    expect(dayStatusText(TODAY, TODAY, null).text).toBe(
      'You can change this day until Wednesday night',
    );
  });

  it('older days are locked', () => {
    expect(dayStatusText('2026-10-16', TODAY, null)).toEqual({
      locked: true,
      text: 'Locked. Only the last 2 days can change.',
    });
  });
});

describe('week panel', () => {
  const habits = createInitialState().habits;

  it('counts days per habit for the week, and shows extra days past the goal', () => {
    // Exercise (3 times a week) done 4 times in the week of Oct 11.
    const log = {
      '2026-10-11': { exercise: 'Started', sleep: 'NailedIt' },
      '2026-10-12': { exercise: 'OnTrack', sleep: 'NotToday' },
      '2026-10-14': { exercise: 'NailedIt' },
      '2026-10-17': { exercise: 'Started' },
      '2026-10-18': { exercise: 'NailedIt' },
    } as TrackerState['log'];
    const rows = weekRows(habits, log, '2026-10-14');
    const row = (id: string) => rows.find((r) => r.habitId === id)!;
    expect(row('exercise')).toMatchObject({ done: 4, goal: 3, label: '3 +1' });
    expect(row('exercise').a11yLabel).toBe('Exercise, goal met, 1 extra this week');
    // Skip never counts.
    expect(row('sleep')).toMatchObject({ done: 1, goal: 7, label: '1 of 7' });
    expect(weekTitle('2026-10-14')).toBe('Week of Oct 11');
  });
});
