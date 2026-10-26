// Pet look data (P2-15a, #122): the look names, each pose's size and shadow, and the anchor points
// where shared accessories snap on (bandages, closed eyes). Anchors are in each image's own pixels
// (pet-looks.json), so one bandage pair fits every cat on any screen. No images loaded here, so
// settings and tests can use it.

import looksData from './pet-looks.json';
import type { Box } from './roomGeometry';

export type PetLookId = keyof typeof looksData;
export const PET_LOOK_IDS = Object.keys(looksData) as PetLookId[];
export const DEFAULT_PET_LOOK: PetLookId = 'tabbyOrange';

export function isPetLookId(value: unknown): value is PetLookId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(looksData, value);
}

/** An accessory's centre, width and turn, in the pose image's own pixels. */
export interface Anchor {
  x: number;
  y: number;
  w: number;
  angle: number;
}

/** An eye to close: its centre and half sizes, in the pose image's own pixels. */
export interface EyeSpot {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface LookPose {
  size: [number, number];
  shadow: { centerX: number; centerY: number; width: number; height: number };
  tail: Anchor;
  leg: Anchor;
  /** Only looks that close their eyes with an overlay. */
  eyes?: EyeSpot[];
}

/** The source pixel size of each bandage piece, so its height follows its anchored width. */
export const BANDAGE_SIZE = { tail: [87, 134], leg: [100, 81] } as const;

/**
 * Where an accessory goes inside the pet's drawn box: its box (before turning) and its turn.
 * Anchors are in source pixels, so they scale with the box on any screen.
 */
export function accessoryBox(
  anchor: Anchor,
  piece: readonly [number, number],
  pose: LookPose,
  image: Pick<Box, 'width' | 'height'>,
): Box & { angle: number } {
  const k = image.width / pose.size[0];
  const width = anchor.w * k;
  const height = width * (piece[1] / piece[0]);
  return {
    left: anchor.x * k - width / 2,
    top: anchor.y * (image.height / pose.size[1]) - height / 2,
    width,
    height,
    angle: anchor.angle,
  };
}

/** An eye's lid box inside the pet's drawn box. */
export function eyeBox(eye: EyeSpot, pose: LookPose, image: Pick<Box, 'width' | 'height'>): Box {
  const kx = image.width / pose.size[0];
  const ky = image.height / pose.size[1];
  return {
    left: (eye.x - eye.rx) * kx,
    top: (eye.y - eye.ry) * ky,
    width: eye.rx * 2 * kx,
    height: eye.ry * 2 * ky,
  };
}
