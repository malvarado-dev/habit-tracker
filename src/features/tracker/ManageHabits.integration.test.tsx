import { expect, it } from '@jest/globals';
import { fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { TrackerFixture, linkedSave, routeParams, DAY } from '@/testing/componentFixture';
import HabitsScreen from '@/app/habits';
import EditBadHabitScreen from '@/app/bad-habit/[id]';
import type { TrackerState } from './state';

const saved = (): TrackerState => JSON.parse(screen.getByTestId('saved-tracker').props.children);

it('management wires the good-habit limit, partner labels and empty state (#132, #143)', async () => {
  const state = linkedSave();
  state.habits = Array.from({ length: 15 }, (_, n) => ({
    ...state.habits[0]!,
    id: `good-${n}`,
    name: `Good ${n}`,
  }));
  state.badHabits = [
    { id: 'paired', name: 'Paired', pairedWith: 'good-0' },
    { id: 'orphan', name: 'Orphan', pairedWith: 'removed' },
    { id: 'soda', name: 'Soda' },
  ];
  const view = await render(
    <TrackerFixture initial={state}>
      <HabitsScreen />
    </TrackerFixture>,
  );
  expect(screen.getByRole('button', { name: 'Add habit' })).toBeDisabled();
  expect(screen.getByTestId('habits-bad-paired')).toHaveAccessibleName('Paired With Good 0');
  for (const id of ['orphan', 'soda']) {
    expect(
      within(screen.getByTestId(`habits-bad-${id}`)).queryByTestId('habits-bad-subtitle'),
    ).not.toBeOnTheScreen();
  }
  await view.rerender(
    <TrackerFixture
      key="empty"
      initial={{ ...state, habits: state.habits.slice(0, 2), badHabits: [] }}
    >
      <HabitsScreen />
    </TrackerFixture>,
  );
  expect(screen.queryByTestId('habits-bad-box')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Add habit' })).toBeEnabled();
});

it('bad habit editor saves valid changes and pairing while rejecting invalid names (#132)', async () => {
  routeParams({ id: 'poor-sleep' });
  const state = linkedSave();
  state.slips = { [DAY]: { 'poor-sleep': 2 } };
  await render(
    <TrackerFixture initial={state}>
      <EditBadHabitScreen />
    </TrackerFixture>,
  );
  await fireEvent.changeText(screen.getByLabelText('Bad habit name'), 'Restless sleep');
  expect(saved().badHabits[0]!.name).toBe('Restless sleep');
  await fireEvent.changeText(screen.getByLabelText('Bad habit name'), 'Sleep');
  expect(screen.getByTestId('edit-bad-name-hint')).toHaveTextContent(/already have/);
  expect(saved().badHabits[0]!.name).toBe('Restless sleep');
  await fireEvent.changeText(screen.getByLabelText('Bad habit name'), '');
  expect(saved().badHabits[0]!.name).toBe('Restless sleep');
  const user = userEvent.setup();
  await user.press(screen.getByRole('radio', { name: 'None' }));
  expect(saved().badHabits[0]!.pairedWith).toBeUndefined();
  await user.press(screen.getByRole('radio', { name: 'Sleep' }));
  expect(saved().badHabits[0]!.pairedWith).toBe('sleep');
  expect(saved().slips).toEqual(state.slips);
});

it('Design 2 management exposes saved frequency and preserves hidden pairing on edits (#132)', async () => {
  routeParams({ id: 'poor-sleep' });
  await render(
    <TrackerFixture initial={linkedSave()} design="design2">
      <HabitsScreen />
      <EditBadHabitScreen />
    </TrackerFixture>,
  );
  expect(screen.getByTestId('habits-row-sleep')).toHaveAccessibleName(
    'Sleep, Every day, 3x per day',
  );
  expect(screen.getByTestId('habits-bad-poor-sleep')).toHaveAccessibleName('Poor Sleep With Sleep');
  expect(screen.queryByRole('radiogroup', { name: 'Pair with' })).not.toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Bad habit name'), 'Restless sleep');
  expect(saved().badHabits[0]).toMatchObject({ name: 'Restless sleep', pairedWith: 'sleep' });
  expect(saved().habits[0]!.timesPerDay).toBe(3);
});
