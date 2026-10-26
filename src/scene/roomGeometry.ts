// Where the living room and everything in it sits on screen (P2-06). Plain math, no screens, so
// every device size is unit tested. Positions in room-layout.json are pixels on the source art;
// this turns them into screen points.
//
// The room fills the screen width. It moves up so the window glass sits just under the status bar,
// and the habit sheet starts low enough that the bed and pet are never under it.

import { tuning } from '@/config/tuning';

type Scene = typeof tuning.scene;
export type PetPose = keyof Scene['pet']['poses'];
export type PetSpot = keyof Scene['pet']['spots'];

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RoomGeometry {
  /** Screen points per source pixel. */
  scale: number;
  room: Box;
  bed: Box;
  bedShadow: Box & { opacity: number; softness: number; color: string };
  /** Where the habit sheet starts. */
  sheetTop: number;
}

export interface PetGeometry {
  pose: PetPose;
  image: Box;
  shadow: Box & { opacity: number; softness: number; color: string };
}

export function roomGeometry(
  screenWidth: number,
  screenHeight: number,
  statusBarHeight: number,
  scene: Scene = tuning.scene,
): RoomGeometry {
  const [sourceWidth = 1, sourceHeight = 1] = scene.sourceSize;
  const scale = screenWidth / sourceWidth;
  const glassTop = scene.windowGlass.y * scale;
  // Up so the glass sits just under the status bar, never down (that would leave a gap on top).
  const shift = Math.max(0, glassTop - (statusBarHeight + scene.windowGapBelowStatusBar));
  const room = { left: 0, top: -shift, width: screenWidth, height: sourceHeight * scale };

  const y = (sourceY: number) => sourceY * scale - shift;
  const x = (sourceX: number) => sourceX * scale;

  const [bedImageWidth = 1, bedImageHeight = 1] = scene.bedImageSize;
  const bedWidth = scene.bed.width * scale;
  const bedHeight = bedWidth * (bedImageHeight / bedImageWidth);
  const bed = {
    left: x(scene.bed.centerX) - bedWidth / 2,
    top: y(scene.bed.bottomY) - bedHeight,
    width: bedWidth,
    height: bedHeight,
  };
  const s = scene.bed.shadow;
  const bedShadow = {
    left: bed.left + s.insetX * scale,
    top: y(scene.bed.bottomY + s.top),
    width: bed.width - 2 * s.insetX * scale,
    height: (s.bottom - s.top) * scale,
    opacity: s.opacity,
    softness: s.softness,
    color: s.color,
  };

  // The lowest thing in the scene decides how high the sheet may start.
  const lowest = Math.max(
    bed.top + bed.height,
    ...Object.keys(scene.pet.spots).map((spot) => {
      const pet = petGeometry(spot as PetSpot, { scale, shift }, scene);
      return pet.image.top + pet.image.height;
    }),
  );
  const sheetTop = Math.max(
    Math.round(screenHeight * scene.sheetTopRatio),
    Math.ceil(lowest + scene.sceneClearOfSheet),
  );

  return { scale, room, bed, bedShadow, sheetTop };
}

/** The parts of a pet look (petLooks.ts) that size and place it. */
export interface LookSizes {
  scale: number;
  poses: Record<
    PetPose,
    {
      size: readonly number[];
      shadow: { centerX: number; centerY: number; width: number; height: number };
    }
  >;
}

/** The pet's image and contact shadow at one of its spots. Its shadow centre sits on the spot. */
export function petGeometry(
  spot: PetSpot,
  { scale, shift, look }: { scale: number; shift: number; look?: LookSizes },
  scene: Scene = tuning.scene,
): PetGeometry {
  const { pose, centerX, bottomY } = scene.pet.spots[spot];
  // A look (P2-15a) brings its own image size and shadow per pose; Tabby-Orange's are the scene's.
  const p = look ? look.poses[pose as PetPose] : scene.pet.poses[pose as PetPose];
  const k = scene.pet.scale * (look?.scale ?? 1) * scale;
  const anchorX = centerX * scale;
  const anchorY = bottomY * scale - shift;
  const image = {
    left: anchorX - p.shadow.centerX * k,
    top: anchorY - p.shadow.centerY * k,
    width: (p.size[0] ?? 0) * k,
    height: (p.size[1] ?? 0) * k,
  };
  const shadow = {
    left: anchorX - (p.shadow.width * k) / 2,
    top: anchorY - (p.shadow.height * k) / 2,
    width: p.shadow.width * k,
    height: p.shadow.height * k,
    ...scene.pet.shadow,
  };
  return { pose: pose as PetPose, image, shadow };
}

/** The room's upward shift for a geometry, for placing the pet. */
export const shiftOf = (g: RoomGeometry) => -g.room.top;
