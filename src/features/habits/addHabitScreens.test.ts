/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Acceptance (T13): Add habit on Habits opens Pick a habit; both add screens are titled
// "Add habit"; no search; Add stays gray until the name is valid; every control has a test ID.
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');
const habits = read('../../app/habits.tsx');
const pick = read('../../app/add-habit/index.tsx');
const details = read('../../app/add-habit/details.tsx');
const form = read('../../components/HabitForm.tsx');

describe('acceptance: Add habit screens (T13)', () => {
  it('Habits opens Pick a habit, and the button turns gray at 15 habits', () => {
    expect(habits).toContain("router.push('/add-habit')");
    expect(habits).toContain('disabled={full}');
    expect(habits).toContain('15 habits is the most.');
  });

  it('both add screens are titled "Add habit", and there is no search', () => {
    for (const src of [pick, details]) expect(src).toMatch(/>\s*Add habit\s*</);
    for (const src of [pick, details]) expect(src).not.toMatch(/TextInput|search-/);
  });

  it('Back on Details names Pick a habit ("Add habit"), and Pick names Habits', () => {
    expect(details).toContain('label="Add habit"');
    expect(pick).toContain('label="Habits"');
  });

  it('Add stays gray and disabled until the name is valid', () => {
    expect(details).toContain('nameProblem(name, names) === null');
    expect(details).toContain('disabled={!canAdd}');
    expect(details).toContain('styles.buttonOff');
  });

  it('already-added habits are dimmed with a check and cannot be picked', () => {
    expect(pick).toContain('disabled={added}');
    expect(pick).toContain('styles.added');
    expect(pick).toContain('✓');
  });

  it('the name field is capped at 20 characters everywhere', () => {
    expect(form).toContain('maxLength={MAX_NAME_LENGTH}');
  });

  it.each([
    [habits, 'habits-add'],
    [pick, 'pick-habit-back'],
    [pick, 'pick-habit-create'],
    [pick, 'pick-habit-${p.key}'],
    [details, 'add-habit-back'],
    [details, 'idPrefix="add"'],
    [details, 'add-habit-confirm'],
  ])('has test ID %#', (src, id) => {
    expect(src).toContain(id);
  });
});
