/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (PRD-15 Cards): every part of the Habit Card that tests look for has a test ID,
// so Playwright and Maestro can find it.
const source = readFileSync(join(__dirname, 'HabitCard.tsx'), 'utf8');
const ids = ['habit-card-', 'habit-icon-', 'habit-ring-', 'habit-name-', 'habit-count-'];

describe('acceptance: Habit Card test IDs', () => {
  it.each(ids)('has test ID %s', (id) => {
    expect(source).toContain(`testID={\`${id}`);
  });
});
