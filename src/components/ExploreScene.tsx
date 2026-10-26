// Explore (P2-16, #87): the pet walks the neighborhood while the world scrolls past. Three art
// layers repeat side to side at their own speeds (near fastest, far slowest), over the app's
// time-of-day sky, with a tint so daylight art matches dusk and night. The pet holds its walk pose
// with a small step bob, and keeps its idle motion, moments and petting (PetMotion).
// Reduced motion: no scrolling and no bob. Every number is in tuning.explore.

import { useEffect } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Background } from '@/components/Background';
import { PetMotion } from '@/components/PetMotion';
import { tuning } from '@/config/tuning';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { exploreLayout, exploreTint, type LayerName } from '@/rules/explore';
import { isBandaged } from '@/rules/quest';
import type { SkyTime } from '@/rules/sky';
import { exploreArt } from '@/scene/art';
import { petLook } from '@/scene/petLooks';

const x = tuning.explore;

export function ExploreScene({
  width,
  sceneHeight,
  time,
}: {
  width: number;
  /** Height of the scene above the habit sheet. */
  sceneHeight: number;
  time: SkyTime;
}) {
  const reduceMotion = useReducedMotion();
  const layout = exploreLayout(width, sceneHeight);
  const tint = exploreTint(time);
  const { petLook: lookId, showBandages } = useSettings();
  const { state } = useTracker();
  const look = petLook(lookId);

  // The pet in its walk pose, paws on the path, a little left of centre so it walks into view.
  const pose = look.poses.walk;
  const petWidth = width * x.petWidthShare;
  const k = petWidth / pose.size[0];
  const image = {
    left: width / 2 - pose.shadow.centerX * k,
    top: layout.pathY - pose.shadow.centerY * k,
    width: petWidth,
    height: pose.size[1] * k,
  };
  const shadowBox = {
    left: width / 2 - (pose.shadow.width * k) / 2,
    top: layout.pathY - (pose.shadow.height * k) / 2,
    width: pose.shadow.width * k,
    height: pose.shadow.height * k,
  };

  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-x.bobHeight, { duration: x.bobMs / 2, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: x.bobMs / 2, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(bob);
      bob.value = 0;
    };
  }, [reduceMotion, bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View
      style={[StyleSheet.absoluteFill, { height: sceneHeight }]}
      pointerEvents="box-none"
      testID="explore-scene"
      nativeID={`pet-look-${look.id}`}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Background time={time} level="full" />
      </View>
      {(['far', 'mid', 'near'] as const).map((name) => (
        <Layer
          key={name}
          name={name}
          source={exploreArt[name]}
          top={layout.top[name]}
          height={layout.height}
          tileWidth={layout.tileWidth}
          copies={layout.copies}
          loopMs={layout.loopMs[name]}
          still={reduceMotion}
        />
      ))}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tint.color, opacity: tint.opacity, height: sceneHeight },
        ]}
        testID="explore-tint"
      />
      <Animated.View style={[StyleSheet.absoluteFill, bobStyle]} pointerEvents="box-none">
        <PetMotion
          pose="walk"
          image={image}
          look={look}
          bandages={showBandages || isBandaged(state.quests)}
          shadowBox={shadowBox}
          shadow={null}
        />
      </Animated.View>
    </View>
  );
}

function Layer({
  name,
  source,
  top,
  height,
  tileWidth,
  copies,
  loopMs,
  still,
}: {
  name: LayerName;
  source: ImageSourcePropType;
  top: number;
  height: number;
  tileWidth: number;
  copies: number;
  loopMs: number;
  still: boolean;
}) {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.value = 0;
    if (still || tileWidth <= 0) return;
    // One tile scrolls past, then it snaps back: the next copy is in the same spot, so no seam.
    offset.value = withRepeat(
      withTiming(-tileWidth, { duration: loopMs, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(offset);
  }, [still, tileWidth, loopMs, offset]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.row, { top, height, width: tileWidth * copies }, style]}
      testID={`explore-layer-${name}`}
    >
      {Array.from({ length: copies }, (_, i) => (
        <Image
          key={i}
          source={source}
          style={{ width: tileWidth, height }}
          accessibilityIgnoresInvertColors
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, flexDirection: 'row' },
});
