// A still critter face for History (critter.md, PRD-05 day snapshots). Same parts as the live
// critter (body, eyes, sleepy eyes, mouth), cropped to the head and with no motion, so it works
// with any body color. C is the sleeping critter (closed eyes, no Zs), B a closed smile, A and S
// a big smile. A and S differ on the calendar cell (lemon fill), not on the face.

import Svg, { Circle, Path } from 'react-native-svg';

import { BODY_PATH, EYE_R, EYE_Y, EYES_X, Mouth, SleepyEyes } from '@/components/Critter';
import type { CritterMood } from '@/components/critterMood';
import { critter } from '@/design/tokens';
import type { Rank } from '@/rules/rank';

/** The head, cropped from the critter's 360 x 260 box. */
const CROP = { x: 70, y: 22, w: 220, h: 180 };

export function rankMood(rank: Rank): CritterMood {
  if (rank === 'C') return 'asleep';
  if (rank === 'B') return 'smile';
  return 'big';
}

type Props = {
  rank: Rank;
  width: number;
  /** Any critter body color; sunny by default. */
  bodyColor?: string;
  testID?: string;
};

export function CritterFace({ rank, width, bodyColor = critter.bodySunny, testID }: Props) {
  const mood = rankMood(rank);
  const height = (width * CROP.h) / CROP.w;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={BODY_PATH} fill={bodyColor} />
      {mood === 'asleep' ? (
        <SleepyEyes />
      ) : (
        EYES_X.map((x) => <Circle key={x} cx={x} cy={EYE_Y} r={EYE_R} fill={critter.ink} />)
      )}
      <Mouth mood={mood} />
    </Svg>
  );
}
