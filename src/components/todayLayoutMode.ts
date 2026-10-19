// Which Today layout fits the screen (T10). Wide is for desktop web and iPad landscape;
// phones and iPad portrait keep the single column.

import { wideLayout } from '@/design/tokens';

export type LayoutMode = 'phone' | 'wide';

export function layoutMode(width: number, height: number): LayoutMode {
  return width >= wideLayout.minWidth && height >= wideLayout.minHeight && width > height
    ? 'wide'
    : 'phone';
}
