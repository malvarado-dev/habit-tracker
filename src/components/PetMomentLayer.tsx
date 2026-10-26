// What the pet's moments add around it (P2-14, #85): small hearts that rise above its head and
// fade, and the bowl or toy that comes in beside it, in front of the pet. Both ignore touches.
// Reduced motion: hearts and props only fade in place. Every number is in tuning.pet.moments.

import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { petColors } from '@/design/tokens';
import { activityArt } from '@/scene/art';
import type { Box } from '@/scene/roomGeometry';

const m = tuning.pet.moments;

export interface HeartSpec {
  id: number;
  delayMs: number;
}

export interface PropSpec {
  id: number;
  kind: 'bowl' | 'toy';
  inMs: number;
  outAt: number;
}

/** Where a prop sits once it lands: beside the pet's right side, on the floor. */
export function propBox(pet: Box): Box {
  const size = pet.width * m.propSize;
  return {
    left: pet.left + pet.width + m.propGap,
    top: pet.top + pet.height - size,
    width: size,
    height: size,
  };
}

export function PetMomentLayer({
  pet,
  hearts,
  prop,
  moves,
}: {
  pet: Box;
  hearts: HeartSpec[];
  prop: PropSpec | null;
  moves: boolean;
}) {
  const size = m.heartSize;
  const heartAt = { left: pet.left + pet.width / 2 - size / 2, top: pet.top - size };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="pet-moment-layer">
      {prop ? <PetProp key={prop.id} spec={prop} box={propBox(pet)} moves={moves} /> : null}
      {hearts.map((h) => (
        <PetHeart key={h.id} delayMs={h.delayMs} at={heartAt} moves={moves} />
      ))}
    </View>
  );
}

function PetHeart({
  delayMs,
  at,
  moves,
}: {
  delayMs: number;
  at: { left: number; top: number };
  moves: boolean;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withTiming(1, { duration: m.heartMs, easing: Easing.out(Easing.quad) }),
    );
  }, [t, delayMs]);
  const style = useAnimatedStyle(() => {
    const v = t.value;
    // Fade in over the first quarter, hold, fade out over the last 30%.
    const opacity = v <= 0 ? 0 : v < 0.25 ? v / 0.25 : v < 0.7 ? 1 : Math.max(0, (1 - v) / 0.3);
    const rise = moves ? (v < 0.25 ? 6 * (1 - v / 0.25) : -m.heartRise * ((v - 0.25) / 0.75)) : 0;
    const scale = moves ? (v < 0.25 ? 0.6 + 0.4 * (v / 0.25) : 1) : 1;
    return { opacity, transform: [{ translateY: rise }, { scale }] };
  });
  const s = m.heartSize;
  return (
    <Animated.View
      style={[styles.abs, { left: at.left, top: at.top, width: s, height: s }, style]}
      testID="pet-heart"
    >
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z"
          fill={petColors.heart}
        />
      </Svg>
    </Animated.View>
  );
}

function PetProp({ spec, box, moves }: { spec: PropSpec; box: Box; moves: boolean }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    const fadeOut = withDelay(spec.outAt, withTiming(0, { duration: m.propOutMs }));
    if (!moves) {
      opacity.value = withSequence(withTiming(1, { duration: m.propOutMs }), fadeOut);
      return;
    }
    opacity.value = 1;
    opacity.value = fadeOut;
    if (spec.kind === 'bowl') {
      // Slides in from off the left edge and stops beside the pet.
      x.value = -(box.left + box.width);
      x.value = withTiming(0, { duration: spec.inMs, easing: Easing.out(Easing.quad) });
      return;
    }
    // Tossed in from up and to the right, lands, then bounces twice.
    const [b1, b2] = m.toyBounces;
    const h = m.tossHeight;
    const d = spec.inMs;
    const ease = Easing.inOut(Easing.quad);
    x.value = m.tossFrom;
    x.value = withTiming(0, { duration: d, easing: Easing.out(Easing.quad) });
    y.value = -h;
    y.value = withSequence(
      withTiming(0, { duration: d * 0.35, easing: Easing.in(Easing.quad) }),
      withTiming(-h * b1, { duration: d * 0.2, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: d * 0.17, easing: Easing.in(Easing.quad) }),
      withTiming(-h * b2, { duration: d * 0.13, easing: ease }),
      withTiming(0, { duration: d * 0.15, easing: Easing.in(Easing.quad) }),
    );
  }, [spec, box, moves, x, y, opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));
  return (
    <Animated.View style={[styles.abs, box, style]} testID={`pet-prop-${spec.kind}`}>
      <Image
        source={spec.kind === 'bowl' ? activityArt.food : activityArt.toy}
        style={{ width: box.width, height: box.height }}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });
