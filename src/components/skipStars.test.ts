/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { habitCardSizes } from '@/design/tokens';

// Acceptance (#41): Skip stars are outlined and crossed out by a diagonal slash; To do
// stars stay plain outlines, so the two differ by shape.
const card = readFileSync(join(__dirname, 'HabitCard.tsx'), 'utf8');

describe('acceptance: Skip stars with a diagonal slash (#41)', () => {
  it('Skip draws outlined stars, never filled ones', () => {
    expect(card).toContain("{i < stars ? '★' : '☆'}");
    expect(card).not.toContain("checkIn === 'NotToday' ? '★'");
  });

  it('only Skip adds the slash, in the Skip star color, at 45 degrees', () => {
    expect(card).toMatch(/checkIn === 'NotToday' \? \(\s*<View\s+testID=\{`habit-star-slash-/);
    expect(card).toContain('backgroundColor: c.starNotToday');
    expect(card).toContain("rotate: '45deg'");
  });

  it('the slash width comes from tokens', () => {
    expect(habitCardSizes.skipSlash).toBe(2);
    expect(card).toContain('width: size.skipSlash');
  });
});
