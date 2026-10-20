/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { swipeHintsFor } from './habitCardLocked';

const source = readFileSync(join(__dirname, 'HabitCard.tsx'), 'utf8');

describe('locked card (Bug #1)', () => {
  it('renders no swipe hints on a locked day', () => {
    expect(swipeHintsFor(true)).toEqual({ left: null, right: null });
  });

  it('keeps both swipe hints on an open day', () => {
    expect(swipeHintsFor(false)).toEqual({ left: 'Nailed it', right: 'Skip' });
  });

  it('dims the card itself, never the swipe container that holds the hints', () => {
    expect(source).toContain('containerStyle={styles.swipeContainer}');
    expect(source).not.toMatch(/containerStyle=\{\[[^\]]*LOCKED_OPACITY/);
    expect(source).toMatch(/style=\{\[scaleStyle, locked && \{ opacity: LOCKED_OPACITY \}\]\}/);
  });

  it('only passes swipe hints to the card when the hints rule gives them', () => {
    expect(source).toContain('const hints = swipeHintsFor(locked);');
    expect(source).toMatch(/renderLeftActions=\{\s*hints\.left/);
    expect(source).toMatch(/renderRightActions=\{\s*hints\.right/);
  });
});
