import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { dayHeaderText } from './historyModel';

afterEach(() => {
  jest.useRealTimers();
});

describe('History edit countdown (#146)', () => {
  it.each([
    ['2026-10-19', 10, 0, '3 days left to edit'],
    ['2026-10-18', 10, 0, '2 days left to edit'],
    ['2026-10-18', 23, 59, '2 days left to edit'],
    ['2026-10-17', 0, 0, '24 hours left to edit'],
    ['2026-10-17', 10, 1, '14 hours left to edit'],
    ['2026-10-17', 23, 0, '1 hour left to edit'],
    ['2026-10-17', 23, 1, '59 minutes left to edit'],
    ['2026-10-17', 23, 59, '1 minute left to edit'],
  ])('%s at %s:%s reads %s', (date, h, m, text) => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 19, h, m));
    expect(dayHeaderText(date, '2026-10-19', null)).toEqual({ locked: false, text });
  });

  it('rounds up a remaining fraction of a minute', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 19, 23, 59, 59));
    expect(dayHeaderText('2026-10-17', '2026-10-19', null).text).toBe('1 minute left to edit');
  });

  it('locks at the deadline and respects saved locks', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 20, 0, 0));
    expect(dayHeaderText('2026-10-17', '2026-10-20', null)).toEqual({
      locked: true,
      text: 'Locked in',
    });
    expect(dayHeaderText('2026-10-19', '2026-10-20', '2026-10-19').locked).toBe(true);
  });

  it('keeps older Test days editable with their special wording', () => {
    expect(dayHeaderText('2026-10-10', '2026-10-19', null, 45)).toEqual({
      locked: false,
      text: 'Changeable in Test',
    });
  });
});
