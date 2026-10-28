// Real selected-day controls and reducer; calendar rendering has separate browser coverage.
import { describe, expect, it, jest } from '@jest/globals';
import { AppState, processColor } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { TrackerFixture, linkedSave as save, DAY } from '@/testing/componentFixture';
import type { TrackerState } from '@/features/tracker/state';
import { tuning } from '@/config/tuning';
import { HistoryEditScope } from './HistoryEditScope';
import { DayDetails } from './HistoryView';

function HistoryFixture({ initial, date = DAY }: { initial: TrackerState; date?: string }) {
  return (
    <TrackerFixture initial={initial}>
      <HistoryEditScope>
        <DayDetails date={date} today={DAY} openDays={2} />
      </HistoryEditScope>
    </TrackerFixture>
  );
}

describe('History components and reducer (#146)', () => {
  it('adds and reverses completion without a Done label or extra name decoration', async () => {
    const user = userEvent.setup();
    await render(<HistoryFixture initial={save(2)} />);
    expect(screen.getByLabelText('Sleep, in progress')).toHaveStyle({
      textDecorationLine: undefined,
    });
    await user.press(screen.getByTestId('habit-card-sleep'));
    expect(screen.getByLabelText('Sleep, completed')).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(screen.queryByText('Done')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('habit-check-sleep')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('habit-strike-sleep')).not.toBeOnTheScreen();
    await user.press(screen.getByTestId('habit-card-sleep'));
    await user.press(screen.getByText('+ Log a habit I missed'));
    expect(screen.getByTestId('habit-name-sleep')).not.toHaveStyle({
      textDecorationLine: 'line-through',
    });
  });

  it('keeps a legacy once-daily bad ring and restores gold when its slip is removed', async () => {
    await render(<HistoryFixture initial={save(1, 1, 1)} />);
    const ring = () => screen.getByTestId('habit-ring-sleep', { includeHiddenElements: true });
    // SVG output is hidden from accessibility; its strokes are the rendered ring colors.
    const strokes = () =>
      ring()
        .queryAll((node) => node.props.strokeDasharray !== undefined)
        .map((node) => node.props.stroke.payload);
    expect(strokes()).toContain(processColor(tuning.ring.slate));
    await fireEvent(screen.getByTestId('bad-chip-poor-sleep'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(strokes()).toContain(processColor(tuning.ring.gold));
    expect(strokes()).not.toContain(processColor(tuning.ring.slate));
    expect(screen.getByLabelText('Sleep, completed')).toBeOnTheScreen();
  });

  it('restores the zero-count linked chip when a missed habit is re-added', async () => {
    const user = userEvent.setup();
    await render(<HistoryFixture initial={save(0, 1)} />);
    await fireEvent(screen.getByTestId('bad-chip-poor-sleep'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    await fireEvent.press(screen.getByTestId('bad-chip-poor-sleep'));
    // Closing unmounts this chip and modal. Test the actual dismissal handler directly;
    // an in-flight synthetic responder release can outlive its target in the test renderer.
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(screen.queryByTestId('bad-chip-poor-sleep')).not.toBeOnTheScreen();
    await user.press(screen.getByText('+ Log a habit I missed'));
    await user.press(screen.getByTestId('habit-card-sleep'));
    expect(screen.getByTestId('bad-chip-poor-sleep')).toHaveAccessibilityValue({ now: 0 });
  });

  it('disables plus at the shared limit and guards accessibility increments', async () => {
    const user = userEvent.setup();
    await render(<HistoryFixture initial={save(3, 2, 5)} />);
    const chip = screen.getByTestId('bad-chip-poor-sleep');
    await user.press(chip);
    expect(screen.getByTestId('bad-stepper-plus')).toBeDisabled();
    await user.press(screen.getByTestId('bad-stepper-minus'));
    expect(screen.getByTestId('bad-stepper-plus')).toBeEnabled();
    await user.press(screen.getByTestId('bad-stepper-plus'));
    expect(screen.getByTestId('bad-stepper-plus')).toBeDisabled();
    await user.press(screen.getByLabelText('Close'));
    await fireEvent(screen.getByTestId('bad-chip-poor-sleep'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(screen.getByTestId('bad-chip-poor-sleep')).toHaveAccessibilityValue({ now: 2, max: 2 });
  });

  it('shows Undo only when a card leaves, restores it, and keeps once-daily Undo', async () => {
    const user = userEvent.setup();
    const state = save(1);
    state.habits.push({ ...state.habits[0]!, id: 'read', name: 'Read', timesPerDay: 1 });
    state.log[DAY]!.read = 1;
    await render(<HistoryFixture initial={state} />);
    await user.press(screen.getByTestId('habit-card-sleep'));
    expect(screen.queryByTestId('undo-bar')).not.toBeOnTheScreen();
    await user.press(screen.getByTestId('habit-card-sleep'));
    expect(screen.queryByTestId('undo-bar')).not.toBeOnTheScreen();
    await user.press(screen.getByTestId('habit-card-sleep'));
    expect(screen.getByTestId('undo-bar')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByTestId('habit-count-sleep')).toHaveTextContent('3/3');
    await user.press(screen.getByRole('button', { name: 'Undo Read' }));
    expect(screen.queryByTestId('habit-card-read')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Read, completed')).toBeOnTheScreen();
  });

  it('refreshes the countdown at minute boundaries and on resume, then locks edits', async () => {
    jest.setSystemTime(new Date('2026-10-25T23:00:00'));
    await render(<HistoryFixture initial={save()} date="2026-10-23" />);
    expect(screen.getByTestId('history-day-status')).toHaveTextContent('1 hour left to edit');
    await act(async () => jest.advanceTimersByTime(60_000));
    expect(screen.getByTestId('history-day-status')).toHaveTextContent('59 minutes left to edit');
    jest.setSystemTime(new Date('2026-10-25T23:59:30'));
    await act(async () => {
      const listener = jest.mocked(AppState.addEventListener).mock.calls[0]![1];
      listener('active');
    });
    expect(screen.getByTestId('history-day-status')).toHaveTextContent('1 minute left to edit');
    await act(async () => jest.advanceTimersByTime(60_000));
    expect(screen.getByTestId('history-day-status')).toHaveTextContent('Locked in');
    expect(screen.queryByText('+ Log a habit I missed')).not.toBeOnTheScreen();
  });
});
