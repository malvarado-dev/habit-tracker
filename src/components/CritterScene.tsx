// The top of the main screen: sky, critter, and energy bar. Each check-in sends a beam of
// light from the sun or moon to the critter (bigger score, bigger beam). Placeholder art.

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Sky } from '@/components/Sky';
import type { SkyLevel } from '@/rules/sky';
import { useTheme } from '@/design/theme/ThemeProvider';
import { colors, font, radius, space } from '@/theme';
import { tuning } from '@/config/tuning';

export interface Beam {
  /** Changes every time a beam should fire. */
  id: number;
  stars: number;
}

interface CritterSceneProps {
  skyLevel: SkyLevel;
  isDay: boolean;
  energy: number;
  checkedInCount: number;
  dueCount: number;
  /** 0 to 1. Drives how brightly the critter glows. */
  glow: number;
  beam: Beam | null;
}

const CRITTER_SIZE = 120;

export function CritterScene(props: CritterSceneProps) {
  const { skyLevel, isDay, energy, checkedInCount, dueCount, glow, beam } = props;
  const reduceMotion = useReducedMotion();
  const { colors: theme } = useTheme(); // Energy bar only; the sky and critter never use the theme.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const asleep = skyLevel === 'asleep';

  const hop = useSharedValue(0);
  const orb = useSharedValue(0);
  const orbOpacity = useSharedValue(0);
  const orbSize = beam ? 10 + beam.stars * 8 : 12;

  useEffect(() => {
    if (!beam || beam.stars === 0) return;
    if (reduceMotion) {
      // No travel; just a soft flash on the critter.
      orbOpacity.value = 0;
      return;
    }
    orb.value = 0;
    orbOpacity.value = 1;
    orb.value = withTiming(1, { duration: tuning.critter.beamTravelMs });
    orbOpacity.value = withSequence(
      withTiming(1, { duration: tuning.critter.beamVisibleMs }),
      withTiming(0, { duration: tuning.critter.beamFadeMs }),
    );
    hop.value = withSequence(
      withTiming(0, { duration: tuning.critter.hopDelayMs }),
      withSpring(-tuning.critter.hopHeight - beam.stars * tuning.critter.hopPerStar),
      withSpring(0),
    );
  }, [beam, reduceMotion, orb, orbOpacity, hop]);

  // The beam starts at the sun or moon (top right) and lands on the critter (center).
  const startX = size.width - 60;
  const startY = 52;
  const endX = size.width / 2;
  const endY = size.height / 2;
  const orbStyle = useAnimatedStyle(() => ({
    opacity: orbOpacity.value,
    transform: [
      { translateX: startX + (endX - startX) * orb.value - orbSize / 2 },
      { translateY: startY + (endY - startY) * orb.value - orbSize / 2 },
    ],
  }));
  const critterStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value }] }));

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  const critterLabel = asleep
    ? 'Your critter is asleep. Check in to wake it up.'
    : 'Your critter is awake.';

  return (
    <View style={styles.wrapper}>
      <View style={styles.scene} onLayout={onLayout} testID="critter-scene">
        <Sky level={skyLevel} isDay={isDay} />

        <Animated.View style={[styles.critterWrap, critterStyle]}>
          <View style={[styles.critterGlow, { opacity: !asleep ? 0.1 + glow * 0.35 : 0 }]} />
          <Text
            style={styles.critter}
            testID="critter"
            accessibilityRole="image"
            accessibilityLabel={critterLabel}
          >
            🐣
          </Text>
          {asleep ? (
            <Text style={styles.zzz} importantForAccessibility="no">
              💤
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.orb,
            { width: orbSize, height: orbSize, borderRadius: orbSize / 2 },
            orbStyle,
          ]}
          testID="energy-beam"
        />

        <View style={styles.ground} />
      </View>

      <View
        style={styles.energyRow}
        testID="energy-bar"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${checkedInCount} of ${dueCount} habits checked in`}
        accessibilityValue={{ min: 0, max: dueCount, now: checkedInCount }}
      >
        <Text style={styles.energyIcon} importantForAccessibility="no">
          ⚡
        </Text>
        <View style={[styles.energyTrack, { backgroundColor: theme.track }]}>
          <View
            style={[
              styles.energyFill,
              { width: `${Math.round(energy * 100)}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.sm },
  scene: {
    height: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  critterWrap: {
    width: CRITTER_SIZE,
    height: CRITTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  critterGlow: {
    position: 'absolute',
    width: CRITTER_SIZE * 1.3,
    height: CRITTER_SIZE * 1.3,
    borderRadius: CRITTER_SIZE,
    backgroundColor: colors.sun,
  },
  critter: { fontSize: font.huge * 0.8, lineHeight: CRITTER_SIZE },
  zzz: { position: 'absolute', top: -6, right: -10, fontSize: font.large },
  orb: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.sun,
    shadowColor: colors.sun,
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 46,
    backgroundColor: colors.ground,
  },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  energyIcon: { fontSize: font.body },
  energyTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  energyFill: { height: '100%', borderRadius: radius.pill },
});
