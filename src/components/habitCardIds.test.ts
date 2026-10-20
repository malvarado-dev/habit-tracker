/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T5): every element on the Habit Card has a test ID, so Playwright and
// Maestro can find it. Decorative-only pieces (swipe hint text, effect particles, the
// icon letter inside its tested circle) are the listed exceptions.
const source = ['HabitCard.tsx', 'CardEffect.tsx']
  .map((f) => readFileSync(join(__dirname, f), 'utf8'))
  .join('\n');
const ids = [
  'habit-card-',
  'habit-icon-',
  'habit-ring-',
  'habit-name-',
  'habit-dots-',
  'habit-dot-',
  'habit-stars-',
  'habit-star-',
  'habit-label-',
  'habit-dim-',
  'habit-hint-',
  'card-effect',
];

describe('acceptance: Habit Card test IDs', () => {
  it.each(ids)('has test ID %s', (id) => {
    expect(source).toContain(`testID={\`${id}`.replace('{`card-effect', '"card-effect'));
  });
});
