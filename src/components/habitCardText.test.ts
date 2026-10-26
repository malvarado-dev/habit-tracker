import { describe, expect, it } from '@jest/globals';

import { iconLetter } from './habitCardText';

describe('Habit Card text (P2-08a)', () => {
  it('uses the first letter of the name as the icon', () => {
    expect(iconLetter('  sleep')).toBe('S');
    expect(iconLetter('')).toBe('?');
  });
});
