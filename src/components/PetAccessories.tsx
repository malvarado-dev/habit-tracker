// Accessories that snap onto any pet look by its anchor points (P2-15a, #122): the tail and leg
// bandages, and the closed-eye lids for looks without eyes-closed images. Drawn inside the pet's
// body, so they breathe, squash and hop with it. Ignore touches.

import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import {
  accessoryBox,
  BANDAGE_ART,
  BANDAGE_SIZE,
  eyeBox,
  type LookPose,
  type PetLook,
} from '@/scene/petLooks';
import type { Box } from '@/scene/roomGeometry';

export function PetBandages({ pose, image }: { pose: LookPose; image: Box }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="pet-bandages">
      {(['tail', 'leg'] as const).map((part) => {
        const b = accessoryBox(pose[part], BANDAGE_SIZE[part], pose, image);
        return (
          <Image
            key={part}
            source={BANDAGE_ART[part]}
            testID={`pet-bandage-${part}`}
            style={[
              styles.abs,
              { left: b.left, top: b.top, width: b.width, height: b.height },
              { transform: [{ rotate: `${b.angle}deg` }] },
            ]}
            accessibilityIgnoresInvertColors
          />
        );
      })}
    </View>
  );
}

/** Closed eyes: a soft lid in the fur color over each eye, with a sleepy arc. */
export function PetEyeLids({ look, pose, image }: { look: PetLook; pose: LookPose; image: Box }) {
  if (!look.lid || !pose.eyes) return null;
  const { fur, line } = look.lid;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="pet-eye-lids">
      {pose.eyes.map((eye, i) => {
        const b = eyeBox(eye, pose, image);
        const id = `lid-${look.id}-${i}`;
        // The arc sits a little low, like a sleepy eye: "‿".
        const arc = `M ${b.width * 0.15} ${b.height * 0.48} Q ${b.width * 0.5} ${b.height * 0.78} ${b.width * 0.85} ${b.height * 0.48}`;
        return (
          <Svg
            key={i}
            width={b.width}
            height={b.height}
            style={[styles.abs, { left: b.left, top: b.top }]}
          >
            <Defs>
              <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset={0.82} stopColor={fur} stopOpacity={1} />
                <Stop offset={1} stopColor={fur} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={b.width / 2}
              cy={b.height / 2}
              rx={b.width / 2}
              ry={b.height / 2}
              fill={`url(#${id})`}
            />
            <Path
              d={arc}
              stroke={line}
              strokeWidth={Math.max(1.5, b.width * 0.11)}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });
