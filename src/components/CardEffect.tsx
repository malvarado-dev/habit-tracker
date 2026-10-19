// The in-card score effect (SPEC-00, T9): plain shapes drawn in code, so it looks the same on
// Android, iPad, and web. Mounted fresh (new key) for each score change, so a fast tap ends the
// old burst and starts the next at once. Never takes touches. Reduced motion shows no particles;
// HabitCard flashes the stars instead.

import { useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import type { CheckIn } from '@/rules/scoring';

import { effectParticles, type EffectColors, type Particle } from './cardEffectLayout';

export function CardEffect({
  checkIn,
  colors,
}: {
  checkIn: CheckIn | undefined;
  colors: EffectColors;
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // Picked once per burst; colors are stable for its short life.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const particles = useMemo(() => effectParticles(checkIn, colors), [checkIn]);
  if (particles.length === 0) return null;

  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const fx = tuning.card.effects;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      testID="card-effect"
    >
      {box
        ? particles.map((p, i) => (
            <ParticleView
              key={i}
              particle={p}
              x={box.w - fx.originFromRight}
              y={fx.originFromTop}
            />
          ))
        : null}
    </View>
  );
}

function ParticleView({ particle: p, x, y }: { particle: Particle; x: number; y: number }) {
  const fx = tuning.card.effects;
  const t = useSharedValue(0);
  const life = p.shape === 'ring' ? fx.popRingMs : fx.particleMs;

  useEffect(() => {
    t.value = withDelay(
      p.delayMs,
      withTiming(1, { duration: life, easing: Easing.out(Easing.cubic) }),
    );
  }, [t, p.delayMs, life]);

  const rad = (p.angle * Math.PI) / 180;
  const dx = Math.cos(rad) * p.distance;
  const dy = Math.sin(rad) * p.distance;
  const rise = p.shape === 'dot' ? -8 : 0;

  const style = useAnimatedStyle(() => {
    const v = t.value;
    const fade = v < 0.55 ? 1 : Math.max(0, (1 - v) / 0.45);
    if (p.shape === 'ring') {
      return { opacity: (1 - v) * 0.9, transform: [{ scale: 0.3 + v * 0.9 }] };
    }
    const grow = p.shape === 'sparkle' ? 0.3 + Math.min(v * 2, 1) * 0.8 : 1 - v * 0.4;
    return {
      opacity: v === 0 ? 0 : fade,
      transform: [
        { translateX: dx * v },
        { translateY: dy * v + rise * v },
        { rotate: p.shape === 'trail' ? `${p.angle + 90}deg` : `${v * 45}deg` },
        { scale: grow },
      ],
    };
  });

  const size = p.size;
  const isTrail = p.shape === 'trail';
  const w = isTrail ? size : size;
  const h = isTrail ? size * 3.5 : size;

  return (
    <Animated.View
      style={[styles.particle, { left: x - w / 2, top: y - h / 2, width: w, height: h }, style]}
    >
      {p.shape === 'sparkle' ? (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
            fill={p.color}
          />
        </Svg>
      ) : p.shape === 'ring' ? (
        <View
          style={[styles.fill, { borderRadius: size / 2, borderWidth: 3, borderColor: p.color }]}
        />
      ) : (
        <View style={[styles.fill, { borderRadius: size / 2, backgroundColor: p.color }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute' },
  fill: { flex: 1 },
});
