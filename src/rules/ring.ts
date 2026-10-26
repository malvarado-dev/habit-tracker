// The segmented ring around a habit's icon (PRD-15 Frequency). Only habits done more than once a
// day get one: one segment per time, filled clockwise from the top, plus a count like "3/8".
// Once-a-day habits show no ring and no count. Plain TypeScript, no screens.

export interface RingState {
  /** One segment per time a day. */
  segments: number;
  /** Segments filled so far, never more than `segments`. */
  filled: number;
  /** "3/8" */
  label: string;
}

/** The ring for a habit, or null for a once-a-day habit. */
export function ringFor(timesPerDay: number, count: number): RingState | null {
  if (timesPerDay <= 1) return null;
  const filled = Math.max(0, Math.min(count, timesPerDay));
  return { segments: timesPerDay, filled, label: `${filled}/${timesPerDay}` };
}

export interface Arc {
  /** Degrees clockwise from 12 o'clock. */
  start: number;
  end: number;
}

/**
 * Where each segment sits, clockwise from 12 o'clock, with an even gap between them. The gap is
 * split across both ends of a segment, so the first one starts just right of the top.
 */
export function segmentArcs(segments: number, gapDegrees: number): Arc[] {
  if (segments <= 0) return [];
  const step = 360 / segments;
  const half = Math.min(gapDegrees, step * 0.5) / 2;
  return Array.from({ length: segments }, (_, i) => ({
    start: i * step + half,
    end: (i + 1) * step - half,
  }));
}

/** An SVG arc path for one segment on a circle of radius `r` around (`c`, `c`). */
export function arcPath(c: number, r: number, arc: Arc): string {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(3)} ${(c + r * Math.sin(rad)).toFixed(3)}`;
  };
  const large = arc.end - arc.start > 180 ? 1 : 0;
  return `M ${point(arc.start)} A ${r} ${r} 0 ${large} 1 ${point(arc.end)}`;
}

/** Length of one segment's arc, for the fill animation's dash. */
export function arcLength(r: number, arc: Arc): number {
  return (Math.PI * r * (arc.end - arc.start)) / 180;
}
