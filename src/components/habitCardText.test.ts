import { describe, expect, it } from '@jest/globals';
import { cardAccessibilityLabel, iconLetter, statusText, weekProgressText } from './habitCardText';

describe('Habit Card status slot (SPEC-00)', () => {
  it('a due card that has not been scored says To do', () => {
    expect(statusText(undefined, true)).toBe('To do');
  });

  it('a card that is not due and not scored says nothing', () => {
    expect(statusText(undefined, false)).toBe('');
  });

  it.each([
    ['Started', 'Started'],
    ['OnTrack', 'On track'],
    ['NailedIt', 'Nailed it'],
    ['NotToday', 'Skip'],
  ] as const)('after a tap, %s shows "%s"', (checkIn, text) => {
    expect(statusText(checkIn, true)).toBe(text);
    expect(statusText(checkIn, false)).toBe(text);
  });
});

describe('screen reader', () => {
  it('hears the weekly goal as "2 of 4 this week"', () => {
    expect(weekProgressText(2, 4)).toBe('2 of 4 this week');
  });

  it('hears the whole card in one sentence', () => {
    expect(cardAccessibilityLabel('Sleep', 'OnTrack', true, 2, 4)).toBe(
      'Sleep, On track, 2 of 3 stars, 2 of 4 this week',
    );
    expect(cardAccessibilityLabel('Sleep', undefined, true, 0, 7)).toBe(
      'Sleep, To do, 0 of 7 this week',
    );
    expect(cardAccessibilityLabel('Exercise', undefined, false, 1, 3)).toBe(
      'Exercise, optional today, 1 of 3 this week',
    );
    expect(cardAccessibilityLabel('  ', 'NotToday', true, 0, 7)).toBe(
      'Untitled habit, Skip, 0 of 3 stars, 0 of 7 this week',
    );
  });
});

describe('letter icon', () => {
  it('uses the first letter of the name, capitalized', () => {
    expect(iconLetter('sleep')).toBe('S');
    expect(iconLetter('  family time')).toBe('F');
    expect(iconLetter('')).toBe('?');
  });
});
