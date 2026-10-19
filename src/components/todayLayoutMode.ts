// Which Today layout fits the screen (T10). Wide is for desktop web and iPad landscape;
// phones and iPad portrait keep the single column.

import { wideLayout } from '@/design/tokens';

export type LayoutMode = 'phone' | 'wide';

export function layoutMode(width: number, height: number): LayoutMode {
  return width >= wideLayout.minWidth && height >= wideLayout.minHeight && width > height
    ? 'wide'
    : 'phone';
}

/**
 * Sizes for the wide layout (T10, #51). The layout stops growing at wideLayout.maxWidth and
 * centers, so everything is measured from the capped width, never the window.
 */
export function wideSizes(width: number, height: number) {
  const contentWidth = Math.min(width, wideLayout.maxWidth);
  const rightWidth =
    contentWidth - wideLayout.pagePadding * 2 - wideLayout.leftColumnWidth - wideLayout.columnGap;
  const sceneHeight = Math.round(
    (height - wideLayout.pagePadding * 2) * wideLayout.sceneHeightRatio,
  );
  const critterWidth = Math.min(
    rightWidth * wideLayout.critterWidthRatio,
    wideLayout.critterMaxWidth,
  );
  return { contentWidth, rightWidth, sceneHeight, critterWidth };
}
