import { expect, it } from '@jest/globals';
import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import '@/testing/componentFixture';
import type { Schedule } from '@/rules/habits';
import { tuning } from '@/config/tuning';
import { HabitForm } from './HabitForm';

function FormFixture() {
  const [name, setName] = useState('Sleep');
  const [times, setTimes] = useState(1);
  const [schedule, setSchedule] = useState<Schedule>({ kind: 'specificDays', days: [1, 3, 5] });
  return (
    <HabitForm
      idPrefix="add"
      name={name}
      onNameChange={setName}
      nameHint=""
      color="habit1"
      schedule={schedule}
      onScheduleChange={setSchedule}
      timesPerDay={times}
      onTimesPerDayChange={setTimes}
    />
  );
}

it('the shared frequency controls update state and stop at both limits (#131)', async () => {
  const user = userEvent.setup();
  await render(<FormFixture />);
  const less = screen.getByRole('button', { name: 'Fewer times per day' });
  const more = screen.getByRole('button', { name: 'More times per day' });
  expect(less).toBeDisabled();
  for (let n = 1; n < tuning.activityBar.timesPerDayMax; n++) await user.press(more);
  expect(screen.getByTestId('add-times-value')).toHaveTextContent(
    String(tuning.activityBar.timesPerDayMax),
  );
  expect(more).toBeDisabled();
  await user.press(less);
  expect(more).toBeEnabled();
  expect(screen.getByTestId('add-times-value')).toHaveTextContent(
    String(tuning.activityBar.timesPerDayMax - 1),
  );
});

it('name edits update the letter and schedule switches retain selected days (#131)', async () => {
  const user = userEvent.setup();
  await render(<FormFixture />);
  await user.clear(screen.getByLabelText('Habit name'));
  await user.type(screen.getByLabelText('Habit name'), 'Water');
  expect(screen.getByTestId('add-habit-icon', { includeHiddenElements: true })).toHaveTextContent(
    'W',
  );
  expect(screen.getByText('SCHEDULE')).toBeOnTheScreen();
  expect(screen.queryByText('HABIT COLOR')).not.toBeOnTheScreen();
  expect(screen.getByTestId('add-goal-result')).toHaveTextContent('3 days a week');
  await user.press(screen.getByRole('radio', { name: 'Any days' }));
  expect(screen.getByTestId('add-goal-result')).toHaveTextContent('Any days');
  await user.press(screen.getByRole('radio', { name: 'Specific days' }));
  expect(screen.getByTestId('add-goal-result')).toHaveTextContent('3 days a week');
});
