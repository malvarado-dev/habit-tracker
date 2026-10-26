// The pet's looks (P2-15a, #122): each look joined with its art. The numbers and the anchor math
// are in petLookData.ts, which loads no images, so tests can use them.

import type { ImageSourcePropType } from 'react-native';

import { accessoryArt, lookArt, petArt } from './art';
import looksData from './pet-looks.json';
import type { LookPose, PetLookId } from './petLookData';
import type { PetPose } from './roomGeometry';

export * from './petLookData';

export interface PetLook {
  id: PetLookId;
  name: string;
  /** Size next to Tabby-Orange, so every look stands the same height in the room. */
  scale: number;
  poses: Record<PetPose, LookPose>;
  art: Record<PetPose, ImageSourcePropType>;
  /** Eyes-closed images (Tabby-Orange). Other looks close their eyes with the lid overlay. */
  eyesClosedArt?: Partial<Record<PetPose, ImageSourcePropType>>;
  /** Lid overlay colors: the fur around the eyes and the closed-eye line. */
  lid?: { fur: string; line: string };
}

const ART: Record<PetLookId, Pick<PetLook, 'art' | 'eyesClosedArt'>> = {
  tabbyOrange: {
    art: { sit: petArt.sit, walk: petArt.walk, sleep: petArt.sleep },
    eyesClosedArt: { sit: petArt.sitEyesClosed, walk: petArt.walkEyesClosed },
  },
  tabbyGray: { art: lookArt.tabbyGray },
  tabbyGrayReal: { art: lookArt.tabbyGrayReal },
};

export function petLook(id: PetLookId): PetLook {
  const data = looksData[id] as Omit<PetLook, 'id' | 'art' | 'eyesClosedArt'>;
  return { id, ...data, ...ART[id] };
}

export const BANDAGE_ART = { tail: accessoryArt.bandageTail, leg: accessoryArt.bandageLeg };
