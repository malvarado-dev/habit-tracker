import { describe, expect, it } from '@jest/globals';

import { cardAccessibilityLabel, iconLetter } from './habitCardText';

describe('Habit Card text (P2-08a)', () => {
  it('uses the first letter of the name as the icon', () => {
    expect(iconLetter('  sleep')).toBe('S');
    expect(iconLetter('')).toBe('?');
  });

  it('frequency habits read their count; once-a-day habits read to do or done', () => {
    expect(cardAccessibilityLabel('Water', 3, 8)).toBe('Water, 3 of 8 today');
    expect(cardAccessibilityLabel('Water', 9, 8)).toBe('Water, 8 of 8 today');
    expect(cardAccessibilityLabel('Sleep', 0, 1)).toBe('Sleep, to do');
    expect(cardAccessibilityLabel('Sleep', 1, 1)).toBe('Sleep, done');
    expect(cardAccessibilityLabel(' ', 0, 1)).toBe('Untitled habit, to do');
  });
});
