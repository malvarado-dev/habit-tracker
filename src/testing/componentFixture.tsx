// Test-only boundaries. Real controls, reducer and design rules remain under test.
import { afterEach, beforeEach, jest } from '@jest/globals';
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { AppState, Text } from 'react-native';
import type { useTracker } from '@/features/tracker/TrackerProvider';
import {
  createInitialState,
  trackerReducer,
  type TrackerAction,
  type TrackerState,
} from '@/features/tracker/state';
import { designView } from '@/features/tracker/designView';
import type { BadHabitDesign } from '@/rules/badHabits';
import { setRemoved } from '@/features/habits/undoRemove';

// Native modal mounting/focus is device behavior. Keep its visible children and the
// app's real backdrop/buttons, so their state changes do not depend on native responders.
jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? children : null,
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View, Text, ScrollView, createAnimatedComponent: (component: unknown) => component },
    useReducedMotion: () => true,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    useAnimatedProps: (callback: () => unknown) => callback(),
    useAnimatedScrollHandler: () => () => {},
    useSharedValue: (value: number) => ({ value, set: () => {}, get: () => value }),
    Easing: { out: (value: unknown) => value, cubic: (value: number) => value },
    Extrapolation: { CLAMP: 'clamp' },
    interpolate: () => 0,
  };
});
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('react-native-gesture-handler', () => ({
  ScrollView: jest.requireActual<typeof import('react-native')>('react-native').ScrollView,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
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
  useSettings: () => ({ badHabitDesign: mockUseEnvironment().design }),
}));
jest.mock('@/features/tracker/TrackerProvider', () => ({
  useTracker: () => mockUseEnvironment().tracker,
  useManageTracker: () => {
    const tracker = mockUseEnvironment().tracker;
    return { ...tracker, state: tracker.managementState };
  },
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => mockRouteParams,
}));
// These visual leaves are outside the control/count risks exercised by these fixtures.
jest.mock('@/components/ActivityBar', () => ({ ActivityBar: () => null }));
jest.mock('@/components/MainQuestCard', () => ({ MainQuestCard: () => null }));
jest.mock('@/components/QuestSheet', () => ({ QuestSheet: () => null }));
jest.mock('@/scene/petMoments', () => ({ announce: jest.fn(), requestPetMoment: jest.fn() }));

export const DAY = '2026-10-25';
let mockRouteParams: Record<string, string> = {};
const mockEnvironment = createContext<{
  tracker: ReturnType<typeof useTracker>;
  design: BadHabitDesign;
} | null>(null);
const mockUseEnvironment = function useTestEnvironment() {
  return useContext(mockEnvironment)!;
};
export function routeParams(params: Record<string, string>) {
  mockRouteParams = params;
}

export function TrackerFixture({
  initial,
  design = 'design1',
  children,
}: {
  initial: TrackerState;
  design?: BadHabitDesign;
  children: ReactNode;
}) {
  const [saved, dispatch] = useReducer(
    (state: TrackerState, action: TrackerAction) => trackerReducer(state, action, design),
    initial,
  );
  const tracker = {
    state: designView(saved, design),
    managementState: saved,
    dispatch,
    today: DAY,
    mode: 'real',
    oldestDay: null,
    openDays: 2,
    testTools: { dayOffset: 0 },
  } as ReturnType<typeof useTracker>;
  return (
    <mockEnvironment.Provider value={{ tracker, design }}>
      {children}
      <Text testID="saved-tracker">{JSON.stringify(saved)}</Text>
    </mockEnvironment.Provider>
  );
}

export function linkedSave(good = 1, bad = 0, times = 3): TrackerState {
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
  jest.useFakeTimers().setSystemTime(new Date(`${DAY}T09:00:00`));
  jest.mocked(AppState.addEventListener).mockClear();
  mockRouteParams = {};
  setRemoved(null);
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
