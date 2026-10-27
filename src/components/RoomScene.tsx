// The living room behind the habit sheet (P2-06, #77). The pet's idle motion is PetMotion (P2-11). Layers, back to front: room, back of the
// bed, pet, front of the bed. Hiding puts the pet behind the back of the bed; the middle of the
// room puts it in front of everything (P2-12). The room is art, not theme: it looks the same in Light and Dark theme. The window
// already shows the day sky; other times of day are out of Prototype 2 scope.

import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { PetMotion } from '@/components/PetMotion';
import { tuning } from '@/config/tuning';
import type { PetPlace } from '@/rules/petPlace';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { isBandaged } from '@/rules/quest';
import { roomArt } from '@/scene/art';
import { petLook } from '@/scene/petLooks';
import { petGeometry, shiftOf, type Box, type RoomGeometry } from '@/scene/roomGeometry';

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

export function RoomScene({
  geometry,
  pet: place,
}: {
  geometry: RoomGeometry;
  /** Where the pet is and which bed layer it's drawn against (P2-12, rules/petPlace.ts). */
  pet: PetPlace;
}) {
  const { room, bed, bedShadow } = geometry;
  // The look picked in Test tools (P2-15a): its art, size, and accessory anchors.
  const { petLook: lookId, showBandages } = useSettings();
  // Bandaged until the Heal quest is claimed (P2-15), or when Test tools asks to see them.
  const { state } = useTracker();
  const bandaged = showBandages || isBandaged(state.quests);
  const look = petLook(lookId);
  const pet = petGeometry(place.spot, {
    scale: geometry.scale,
    shift: shiftOf(geometry),
    look,
  });
  const at = (b: Box) => ({ left: b.left, top: b.top, width: b.width, height: b.height });

  // Floor below the art (#135): the art's bottom plank rows repeat down to the screen's bottom.
  const { height: screenHeight } = useWindowDimensions();
  const [bandFrom, bandTo] = tuning.scene.floorRepeat;
  const bandHeight = (bandTo - bandFrom) * geometry.scale;
  const roomBottom = room.top + room.height;
  const bands =
    bandHeight > 0 ? Math.max(0, Math.ceil((screenHeight - roomBottom) / bandHeight)) : 0;

  const petLayer = (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="pet-layer"
      nativeID={`pet-at-${place.spot}-${place.layer}`}
    >
      <PetMotion
        pose={pet.pose}
        image={pet.image}
        look={look}
        bandages={bandaged}
        shadowBox={pet.shadow}
        shadow={<SoftShadow box={{ ...pet.shadow, left: 0, top: 0 }} id="pet-shadow" />}
      />
    </View>
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.floor]}
      // Only the pet takes touches (petting, P2-14); everything else in the room passes them on.
      pointerEvents="box-none"
      testID="room-scene"
      // Which pet look is drawn (P2-15a), for tests.
      nativeID={`pet-look-${look.id}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {geometry.wallGap > 0
        ? tuning.scene.wallTop.map((band) => (
            <View
              key={band.from}
              testID="wall-top"
              style={[
                styles.abs,
                {
                  top: 0,
                  // A point of overlap so no seam shows where the bands and the art meet.
                  height: geometry.wallGap + 1,
                  left: band.from * room.width,
                  width: (band.to - band.from) * room.width + 1,
                  backgroundColor: band.color,
                },
              ]}
            />
          ))
        : null}
      <Image
        source={roomArt.base}
        style={[styles.abs, at(room)]}
        resizeMode="stretch"
        testID="room-base"
      />
      {Array.from({ length: bands }, (_, i) => (
        <View
          key={i}
          testID="floor-repeat"
          style={[
            styles.abs,
            {
              left: 0,
              width: room.width,
              top: roomBottom + i * bandHeight,
              height: bandHeight + 1,
            },
            styles.clip,
          ]}
        >
          <Image
            source={roomArt.base}
            resizeMode="stretch"
            style={[
              styles.abs,
              { left: 0, top: -bandFrom * geometry.scale, width: room.width, height: room.height },
            ]}
          />
        </View>
      ))}
      <SoftShadow box={bedShadow} id="bed-shadow" />
      {place.layer === 'behindBed' ? petLayer : null}
      <Image
        source={roomArt.bedBack}
        style={[styles.abs, at(bed)]}
        resizeMode="stretch"
        testID="bed-back"
      />
      {place.layer === 'inBed' ? petLayer : null}
      <Image
        source={roomArt.bedFront}
        style={[styles.abs, at(bed)]}
        resizeMode="stretch"
        testID="bed-front"
      />
      {place.layer === 'front' ? petLayer : null}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  clip: { overflow: 'hidden' },
  // Never seen on a normal screen; it backs the room if a tall screen runs past the art.
  floor: { backgroundColor: tuning.scene.floorColor, overflow: 'hidden' },
});
