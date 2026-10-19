import { describe, expect, it } from '@jest/globals';

import { DEFAULT_HABITS } from '@/features/tracker/state';

import { cleanName, MAX_NAME_LENGTH, nameCounter, nameHint, nameProblem } from './habitName';

const habits = DEFAULT_HABITS;

describe('acceptance: habit name rules (T13)', () => {
  it('blank names are never allowed, spaces included', () => {
    expect(nameProblem('', habits)).toBe('blank');
    expect(nameProblem('    ', habits)).toBe('blank');
    expect(nameHint('  ', habits)).toBe('Give this habit a name.');
  });

  it('duplicates are not allowed, ignoring capitals and extra spaces', () => {
    for (const name of ['Sleep', 'sleep', '  SLEEP  ', 'Sleep ']) {
      expect(nameProblem(name, habits)).toBe('duplicate');
    }
    expect(nameHint('sleep', habits)).toBe('You already have a habit called Sleep.');
  });

  it('a habit keeps its own name while being edited', () => {
    expect(nameProblem('sleep', habits, 'sleep')).toBeNull();
    expect(nameProblem('Diet', habits, 'sleep')).toBe('duplicate');
  });

  it('names can be up to 20 characters', () => {
    expect(MAX_NAME_LENGTH).toBe(20);
    expect(nameProblem('a'.repeat(20), habits)).toBeNull();
    expect(nameProblem('a'.repeat(21), habits)).toBe('tooLong');
  });

  it('cleans the ends and squeezes extra spaces', () => {
    expect(cleanName('  Read   before  bed ')).toBe('Read before bed');
  });

  it('shows the counter only past 15 characters', () => {
    expect(nameCounter('Reading')).toBe('');
    expect(nameCounter('a'.repeat(15))).toBe('');
    expect(nameCounter('a'.repeat(18))).toBe('18 of 20');
  });
});
