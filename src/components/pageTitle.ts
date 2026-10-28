// Browser tab and screen reader page names on the web build (#113, WCAG 2.4.2 Page Titled).
// Each screen gets "<screen> · Habit Tracker". Keyed by Expo Router route name.

export const APP_TITLE = 'Habit Tracker';

const SCREENS: Record<string, string> = {
  index: 'Today',
  history: 'History',
  habits: 'Manage habits',
  profile: 'Profile',
  'test-tools': 'Test tools',
  'add-habit/index': 'Add habit',
  'add-habit/details': 'Habit details',
  'add-habit/bad': 'Bad habit details',
  'habit/[id]': 'Edit habit',
  'bad-habit/[id]': 'Edit bad habit',
};

/** The page title for a route. Unknown routes get the app name alone. */
export function pageTitle(routeName: string): string {
  const screen = SCREENS[routeName];
  return screen ? `${screen} · ${APP_TITLE}` : APP_TITLE;
}
