// The living room behind the habit sheet (P2-06, #77). Layers, back to front: room, back of the
// bed, pet, front of the bed. When the pet hides (low Confidence, P2-12), it moves behind the back
// of the bed. The room is art, not theme: it looks the same in Light and Dark theme. The window
// already shows the day sky; other times of day are out of Prototype 2 scope.

import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { petArt, roomArt } from '@/scene/art';
import {
  petGeometry,
  shiftOf,
  type Box,
  type PetSpot,
  type RoomGeometry,
} from '@/scene/roomGeometry';

type Shadow = Box & { opacity: number; softness: number; color: string };

/** A soft oval shadow: solid in the middle, fading out at the edge. */
function SoftShadow({ box, id }: { box: Shadow; id: string }) {
  // Softness is the fade width in source pixels; turn it into a share of the oval.
  const fade = Math.min(0.9, (box.softness * 6) / Math.max(box.width, 1));
  return (
    <Svg
      style={[styles.abs, { left: box.left, top: box.top, width: box.width, height: box.height }]}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset={1 - fade} stopColor={box.color} stopOpacity={box.opacity} />
          <Stop offset={1} stopColor={box.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={box.width / 2}
        cy={box.height / 2}
        rx={box.width / 2}
        ry={box.height / 2}
        fill={`url(#${id})`}
      />
    </Svg>
  );
}

const POSE_ART = { sit: petArt.sit, sleep: petArt.sleep, walk: petArt.walk } as const;

export function RoomScene({
  geometry,
  petSpot,
  petHiding = false,
}: {
  geometry: RoomGeometry;
  petSpot: PetSpot;
  /** Hiding: the pet goes behind the back of the bed. */
  petHiding?: boolean;
}) {
  const { room, bed, bedShadow } = geometry;
  const pet = petGeometry(petSpot, { scale: geometry.scale, shift: shiftOf(geometry) });
  const at = (b: Box) => ({ left: b.left, top: b.top, width: b.width, height: b.height });

  const petLayer = (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="pet-layer">
      <SoftShadow box={pet.shadow} id="pet-shadow" />
      <Image
        source={POSE_ART[pet.pose]}
        style={[styles.abs, at(pet.image)]}
        resizeMode="stretch"
        testID="pet-image"
        accessibilityIgnoresInvertColors
      />
    </View>
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.floor]}
      pointerEvents="none"
      testID="room-scene"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={roomArt.base}
        style={[styles.abs, at(room)]}
        resizeMode="stretch"
        testID="room-base"
      />
      <SoftShadow box={bedShadow} id="bed-shadow" />
      {petHiding ? petLayer : null}
      <Image source={roomArt.bedBack} style={[styles.abs, at(bed)]} resizeMode="stretch" />
      {petHiding ? null : petLayer}
      <Image source={roomArt.bedFront} style={[styles.abs, at(bed)]} resizeMode="stretch" />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  // Never seen on a normal screen; it backs the room if a tall screen runs past the art.
  floor: { backgroundColor: tuning.scene.floorColor, overflow: 'hidden' },
});
