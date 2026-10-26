import { describe, expect, it } from '@jest/globals';

import { questProgressText } from './mainQuestText';

describe('Main Quest text (P2-07)', () => {
  it('reads "0/7 Check in days" for day quests and "0/3 Check in streak" for streak quests', () => {
    expect(questProgressText(0, 7, 'days')).toBe('0/7 Check in days');
    expect(questProgressText(3, 7, 'days')).toBe('3/7 Check in days');
    expect(questProgressText(0, 3, 'streak')).toBe('0/3 Check in streak');
  });
});
