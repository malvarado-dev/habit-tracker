// Real History controls and reducer, without a browser, storage, navigation or private art.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { AppState, processColor } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { tuning } from '@/config/tuning';
import {
  createInitialState,
  trackerReducer,
  type TrackerAction,
  type TrackerState,
} from '@/features/tracker/state';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { HistoryEditScope } from './HistoryEditScope';
import { HistoryView } from './HistoryView';

jest.mock('react-native-reanimated', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View, Text, createAnimatedComponent: (component: unknown) => component },
    useReducedMotion: () => true,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useAnimatedProps: (callback: () => unknown) => callback(),
    useSharedValue: (value: number) => ({ value, set: () => {}, get: () => value }),
    Easing: { out: (easing: unknown) => easing, cubic: (value: number) => value },
  };
});
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/design/theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: jest
      .requireActual<typeof import('@/design/theme/theme')>('@/design/theme/theme')
      .themeColors('light'),
  }),
}));
jest.mock('@/features/settings/SettingsProvider', () => ({
  useSettings: () => ({ badHabitDesign: 'design1' }),
}));
jest.mock('@/features/tracker/TrackerProvider', () => ({ useTracker: () => mockUseTracker() }));

const DAY = '2026-10-25';
const mockTrackerContext = createContext<ReturnType<typeof useTracker> | null>(null);
const mockUseTracker = function useTestTracker() {
  return useContext(mockTrackerContext)!;
};

function HistoryFixture({ initial }: { initial: TrackerState }) {
  const [state, dispatch] = useReducer(
    (state: TrackerState, action: TrackerAction) => trackerReducer(state, action),
    initial,
  );
  const tracker = {
    state,
    dispatch,
    today: DAY,
    oldestDay: null,
    openDays: 2,
    testTools: { dayOffset: 0 },
  } as ReturnType<typeof useTracker>;
  return (
    <mockTrackerContext.Provider value={tracker}>
      <HistoryEditScope>
        <HistoryView />
      </HistoryEditScope>
    </mockTrackerContext.Provider>
  );
}

function save(good = 1, bad = 0, times = 3): TrackerState {
  const state = createInitialState();
  return {
    ...state,
    habits: [{ ...state.habits[0]!, timesPerDay: times }],
    badHabits: [{ id: 'poor-sleep', name: 'Poor Sleep', pairedWith: 'sleep' }],
    log: { [DAY]: { sleep: good } },
    slips: { [DAY]: { 'poor-sleep': bad } },
  };
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-25T09:00:00'));
  jest.mocked(AppState.addEventListener).mockClear();
  // Supply layout only; keep the actual chip, popup, events and count rules.
  const methods = jest.requireActual<{ default: { measureInWindow: ReturnType<typeof jest.fn> } }>(
    '@react-native/jest-preset/jest/MockNativeMethods',
  ).default;
  methods.measureInWindow.mockImplementation((...args: unknown[]) => {
    (args[0] as (x: number, y: number, width: number, height: number) => void)(0, 200, 100, 44);
  });
});
afterEach(() => {
  jest.useRealTimers();
});

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
    await user.press(screen.getByTestId('bad-chip-poor-sleep'));
    await user.press(screen.getByLabelText('Close'));
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
    const user = userEvent.setup();
    await render(<HistoryFixture initial={save()} />);
    await user.press(screen.getByTestId('history-day-2026-10-23'));
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
