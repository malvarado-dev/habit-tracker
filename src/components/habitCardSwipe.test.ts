/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { tuning } from '@/config/tuning';

// Acceptance (T6): full swipes only, and a vertical drag never scores. The card grabs only after
// clear sideways movement, and a swipe scores only when released past the threshold.
const source = readFileSync(join(__dirname, 'HabitCard.tsx'), 'utf8');

describe('acceptance: swipes (T6)', () => {
  it('full right is Nailed it and full left is Not today', () => {
    expect(source).toContain("SwipeDirection.RIGHT ? 'NailedIt' : 'NotToday'");
  });

  it('the card waits for clear sideways movement before it follows the finger', () => {
    expect(source).toContain('dragOffsetFromLeft={tuning.card.swipeStartOffset}');
    expect(source).toContain('dragOffsetFromRight={-tuning.card.swipeStartOffset}');
    expect(tuning.card.swipeStartOffset).toBeGreaterThan(10);
  });

  it('a swipe scores only past a long sideways distance', () => {
    expect(tuning.card.swipeThreshold).toBeGreaterThanOrEqual(tuning.card.swipeStartOffset * 5);
  });

  it('every swipe has a screen reader action', () => {
    expect(source).toContain("name: 'nailedIt'");
    expect(source).toContain("name: 'notToday'");
  });
});
