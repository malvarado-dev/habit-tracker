// A still critter face for History (critter.md, PRD-05 day snapshots). Same parts as the live
// critter (body, eyes, sleepy eyes, mouth), cropped to the head and with no motion, so it works
// with any body color. History shows it with a big smile on check-in days (the Activity Bar filled);
// ranks were removed in P2-08a. P2-18 (#89) replaces this calendar with the streak band.

import Svg, { Circle, Path } from 'react-native-svg';

import { BODY_PATH, EYE_R, EYE_Y, EYES_X, Mouth, SleepyEyes } from '@/components/Critter';
import type { CritterMood } from '@/components/critterMood';
import { critter } from '@/design/tokens';

/** The head, cropped from the critter's 360 x 260 box. */
const CROP = { x: 70, y: 22, w: 220, h: 180 };

type Props = {
  mood: CritterMood;
  width: number;
  /** Any critter body color; sunny by default. */
  bodyColor?: string;
  testID?: string;
};

export function CritterFace({ mood, width, bodyColor = critter.bodySunny, testID }: Props) {
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
