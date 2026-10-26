import { describe, expect, it } from '@jest/globals';

import { modeHelpText, pretendDateText, realDateText, shortDate } from './testToolsText';

describe('Test tools text (T14, T17)', () => {
  it('names the pretend day and how far ahead it is', () => {
    expect(shortDate('2026-10-21')).toBe('Wed, Oct 21');
    expect(pretendDateText('2026-10-19', 0)).toBe('Testing as Mon, Oct 19 (today)');
    expect(pretendDateText('2026-10-20', 1)).toBe('Testing as Tue, Oct 20 (1 day ahead)');
    expect(pretendDateText('2026-10-21', 2)).toBe('Testing as Wed, Oct 21 (2 days ahead)');
  });

  it('Real shows only the real date and says the tools are off', () => {
    expect(realDateText('2026-10-19')).toBe('Today is Mon, Oct 19');
    expect(modeHelpText('real')).toContain('real data');
    expect(modeHelpText('test')).toContain('untouched');
  });
});
