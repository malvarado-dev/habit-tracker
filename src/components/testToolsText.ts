// What the Test tools area says. Plain functions so they can be unit tested.

import { weekdayIndex, type DateKey } from '@/rules/dates';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Wed, Oct 21" for a date key. */
export function shortDate(key: DateKey): string {
  const [, m = 1, d = 1] = key.split('-').map(Number);
  return `${DAYS[weekdayIndex(key)]}, ${MONTHS[m - 1]} ${d}`;
}

/** "Testing as Wed, Oct 21 (2 days ahead)", or "(today)" when not skipped ahead. */
export function pretendDateText(today: DateKey, dayOffset: number): string {
  const ahead =
    dayOffset === 0 ? 'today' : `${dayOffset} ${dayOffset === 1 ? 'day' : 'days'} ahead`;
  return `Testing as ${shortDate(today)} (${ahead})`;
}

/** "Today is Mon, Oct 19". Real is always the real date. */
export function realDateText(today: DateKey): string {
  return `Today is ${shortDate(today)}`;
}

/** One line under the Real / Test switch saying what each one is. */
export function modeHelpText(mode: 'real' | 'test'): string {
  return mode === 'real'
    ? 'Your real data on the real date. Test tools are off.'
    : 'A separate test save. Your real data is untouched.';
}
