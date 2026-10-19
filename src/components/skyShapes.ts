// Shapes for the Background, kept apart from the component so they can be unit tested.

import { tuning } from '@/config/tuning';

/** A crescent moon that opens to the right, inside a square of side 2r (background.md). */
export function crescent(r: number): string {
  const inner = r * tuning.sky.crescentInner;
  return `M${r} 0 A${r} ${r} 0 1 0 ${r} ${2 * r} A${inner} ${r} 0 1 1 ${r} 0 Z`;
}
