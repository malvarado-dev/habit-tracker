import { describe, expect, it } from '@jest/globals';

import { arcLength, arcPath, ringFor, segmentArcs, segmentFills } from './ring';

describe('segmented ring (PRD-15 Frequency)', () => {
  it('once-a-day habits have no ring or count', () => {
    expect(ringFor(1, 0)).toBeNull();
    expect(ringFor(1, 1)).toBeNull();
  });

  it('one segment per time, filled up to the count, with a "3/8" label', () => {
    expect(ringFor(8, 3)).toEqual({ segments: 8, filled: 3, gold: 3, slate: 0, label: '3/8' });
    expect(ringFor(3, 0)).toEqual({ segments: 3, filled: 0, gold: 0, slate: 0, label: '0/3' });
  });

  it('gold segments come first, then slate, then empty (P2-08b)', () => {
    const ring = ringFor(5, 2, 2)!;
    expect(ring).toMatchObject({ filled: 4, gold: 2, slate: 2, label: '4/5' });
    expect(segmentFills(ring)).toEqual(['gold', 'gold', 'slate', 'slate', 'empty']);
    // Slate never runs past the last segment.
    expect(segmentFills(ringFor(3, 2, 5)!)).toEqual(['gold', 'gold', 'slate']);
    expect(segmentFills(ringFor(3, 0, 1)!)).toEqual(['slate', 'empty', 'empty']);
  });

  it('never fills past the last segment or below zero', () => {
    expect(ringFor(3, 5)?.filled).toBe(3);
    expect(ringFor(3, -1)?.filled).toBe(0);
  });

  it('segments go clockwise from 12 o’clock with even gaps', () => {
    const arcs = segmentArcs(4, 10);
    expect(arcs).toEqual([
      { start: 5, end: 85 },
      { start: 95, end: 175 },
      { start: 185, end: 265 },
      { start: 275, end: 355 },
    ]);
  });

  it('a big gap never swallows a segment', () => {
    for (const arc of segmentArcs(12, 90)) expect(arc.end).toBeGreaterThan(arc.start);
  });

  it('draws each segment clockwise from its start point', () => {
    // First of 4 segments with no gap: from the top (12 o'clock) to the right (3 o'clock).
    const [first] = segmentArcs(4, 0);
    expect(arcPath(24, 20, first!)).toBe('M 24.000 4.000 A 20 20 0 0 1 44.000 24.000');
    expect(arcLength(20, first!)).toBeCloseTo(Math.PI * 10);
  });
});
