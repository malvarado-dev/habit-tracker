import { expect, it, jest } from '@jest/globals';
import { render, screen, userEvent, fireEvent, act } from '@testing-library/react-native';
import { TrackerFixture, linkedSave, DAY } from '@/testing/componentFixture';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { slipCount } from '@/rules/badHabits';
import { BadHabitsTray } from './BadHabitsTray';
import { HabitSheet } from './HabitSheet';
import { DayDetails } from './history/HistoryView';
import { HistoryEditScope } from './history/HistoryEditScope';
import type { TrackerState } from '@/features/tracker/state';

function standalone() {
  const state = linkedSave(0);
  state.badHabits = [{ id: 'soda', name: 'Soda' }];
  return state;
}
function Tray() {
  const { state, dispatch } = useTracker();
  return (
    <BadHabitsTray
      badHabits={state.badHabits}
      countOf={(id) => slipCount(state.slips, DAY, id)}
      onSlip={(bad) => dispatch({ type: 'logSlip', date: DAY, badHabitId: bad.id })}
      onSetCount={(bad, count) =>
        dispatch({ type: 'setSlips', date: DAY, badHabitId: bad.id, count })
      }
      tapOpensStepper
    />
  );
}
function History({ initial }: { initial: TrackerState }) {
  return (
    <TrackerFixture initial={initial}>
      <HistoryEditScope>
        <DayDetails date={DAY} today={DAY} openDays={2} />
      </HistoryEditScope>
    </TrackerFixture>
  );
}
async function action(id: string, name: string) {
  await fireEvent(screen.getByTestId(id), 'accessibilityAction', {
    nativeEvent: { actionName: name },
  });
}

it('tap opens controls without logging, stays open while idle, and dismisses (#141)', async () => {
  const user = userEvent.setup();
  await render(
    <TrackerFixture initial={standalone()}>
      <Tray />
    </TrackerFixture>,
  );
  await user.press(screen.getByTestId('bad-chip-soda'));
  expect(screen.getByTestId('bad-badge-soda')).toHaveTextContent('0');
  expect(screen.getByTestId('bad-stepper')).toBeOnTheScreen();
  expect(screen.getByText('Tap to adjust slips.')).toBeOnTheScreen();
  await act(async () => {
    jest.advanceTimersByTime(60_000);
  });
  expect(screen.getByTestId('bad-stepper')).toBeOnTheScreen();
  await fireEvent.press(screen.getByLabelText('Close'));
  expect(screen.queryByTestId('bad-stepper')).not.toBeOnTheScreen();
});

it('popup has no duplicate count, updates the chip and spoken labels, and stops at zero (#141)', async () => {
  const user = userEvent.setup();
  await render(
    <TrackerFixture initial={standalone()}>
      <Tray />
    </TrackerFixture>,
  );
  await user.press(screen.getByTestId('bad-chip-soda'));
  expect(screen.getByTestId('bad-stepper')).toHaveTextContent('−+');
  expect(screen.getByTestId('bad-stepper-minus')).toBeDisabled();
  await user.press(screen.getByTestId('bad-stepper-plus'));
  expect(screen.getByTestId('bad-badge-soda')).toHaveTextContent('1');
  expect(screen.getByTestId('bad-stepper-plus')).toHaveAccessibleName('One more Soda, 1 slip');
  await user.press(screen.getByTestId('bad-stepper-minus'));
  expect(screen.getByTestId('bad-badge-soda')).toHaveTextContent('0');
  expect(screen.getByTestId('bad-stepper-minus')).toBeDisabled();
});

it('Today shows Undo only after good completion, a completing linked slip or Skip (#141)', async () => {
  const user = userEvent.setup();
  await render(
    <TrackerFixture initial={linkedSave(0)}>
      <HabitSheet bottomPadding={0} />
    </TrackerFixture>,
  );
  await user.press(screen.getByTestId('habit-card-sleep'));
  expect(screen.queryByTestId('undo-bar')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('habit-card-sleep'));
  await user.press(screen.getByTestId('habit-card-sleep'));
  expect(screen.queryByTestId('habit-card-sleep')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByTestId('habit-count-sleep')).toHaveTextContent('2/3');
  await action('habit-card-sleep', 'slip');
  expect(screen.queryByTestId('habit-card-sleep')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByTestId('habit-count-sleep')).toHaveTextContent('2/3');
  await action('habit-card-sleep', 'skip');
  expect(screen.queryByTestId('habit-card-sleep')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByTestId('habit-card-sleep')).toBeOnTheScreen();
});

it('Today count edits preserve Undo for another removed card (#141)', async () => {
  const user = userEvent.setup();
  const state = standalone();
  state.habits.push({ ...state.habits[0]!, id: 'read', name: 'Read', timesPerDay: 1 });
  await render(
    <TrackerFixture initial={state}>
      <HabitSheet bottomPadding={0} />
    </TrackerFixture>,
  );
  await user.press(screen.getByTestId('habit-card-read'));
  await user.press(screen.getByTestId('habit-card-sleep'));
  await action('bad-chip-soda', 'increment');
  expect(screen.getByTestId('undo-text')).toHaveTextContent('Read logged');
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByTestId('habit-card-read')).toBeOnTheScreen();
  expect(screen.getByTestId('habit-count-sleep')).toHaveTextContent('1/3');
  expect(screen.getByTestId('bad-badge-soda')).toHaveTextContent('1');
});

it('History standalone count edits stay quiet and preserve an earlier removal Undo (#141)', async () => {
  const user = userEvent.setup();
  const state = standalone();
  state.habits.push({ ...state.habits[0]!, id: 'read', name: 'Read', timesPerDay: 1 });
  state.log = { [DAY]: { sleep: 1, read: 1 } };
  state.slips = { [DAY]: { soda: 1 } };
  await render(<History initial={state} />);
  await action('bad-chip-soda', 'increment');
  expect(screen.queryByTestId('undo-bar')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('history-undo-read'));
  await user.press(screen.getByTestId('habit-card-sleep'));
  await action('bad-chip-soda', 'decrement');
  await action('bad-chip-soda', 'decrement');
  expect(screen.getByTestId('undo-text')).toHaveTextContent('Read log removed');
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByLabelText('Read, completed')).toBeOnTheScreen();
  expect(screen.getByTestId('habit-count-sleep')).toHaveTextContent('2/3');
  expect(screen.getByTestId('bad-badge-soda')).toHaveTextContent('0');
});

it('History adding a missed habit stays quiet and reversing the last linked log shows Undo (#141)', async () => {
  const user = userEvent.setup();
  const state = linkedSave(0, 1, 1);
  state.habits.push({ ...state.habits[0]!, id: 'read', name: 'Read' });
  await render(<History initial={state} />);
  await user.press(screen.getByText('+ Log a habit I missed'));
  await user.press(screen.getByTestId('habit-card-read'));
  expect(screen.queryByTestId('undo-bar')).not.toBeOnTheScreen();
  await user.press(screen.getByTestId('history-undo-sleep'));
  expect(screen.queryByLabelText('Sleep, completed')).not.toBeOnTheScreen();
  expect(screen.getByTestId('undo-bar')).toBeOnTheScreen();
  await user.press(screen.getByTestId('undo-button'));
  expect(screen.getByLabelText('Sleep, completed')).toBeOnTheScreen();
  expect(screen.getByLabelText('Read, completed')).toBeOnTheScreen();
});
