// The Activity Bar's side of the payoff (P2-14, #85): notch icons rattle when the fill reaches
// them and pop when their moment plays, and the moment's caption fades in above the bar.
// Reduced motion: icons brighten instead of moving. Every number is in tuning.pet.moments.

import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, type ImageSourcePropType, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { onAnnounce, onPetMomentStart } from '@/scene/petMoments';

const m = tuning.pet.moments;

export function NotchIcon({
  name,
  source,
  rattle,
  pop,
  reduceMotion,
  style,
}: {
  name: string;
  source: ImageSourcePropType;
  /** Bumped each time the fill reaches this notch. */
  rattle: number;
  /** Bumped each time this notch's moment plays. */
  pop: number;
  reduceMotion: boolean;
  style: ViewStyle;
}) {
  const { colors } = useTheme();
  const angle = useSharedValue(0);
  const scale = useSharedValue(1);
  const bright = useSharedValue(0);

  const brighten = () => {
    bright.value = withSequence(
      withTiming(m.brightenOpacity, { duration: m.rattleMs / 2 }),
      withTiming(0, { duration: m.rattleMs / 2 }),
    );
  };

  useEffect(() => {
    if (rattle === 0) return;
    if (reduceMotion) return brighten();
    const d = m.rattleDegrees;
    const step = m.rattleMs / 5;
    angle.value = withSequence(
      withTiming(-d, { duration: step }),
      withTiming(d * 0.8, { duration: step }),
      withTiming(-d * 0.45, { duration: step }),
      withTiming(d * 0.2, { duration: step }),
      withSpring(0),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rattle]);

  useEffect(() => {
    if (pop === 0) return;
    if (reduceMotion) return brighten();
    scale.value = withSequence(
      withTiming(m.popScale, { duration: m.popMs / 2 }),
      withTiming(1, { duration: m.popMs / 2 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }, { scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: bright.value }));

  return (
    <Animated.View
      style={[style, iconStyle]}
      pointerEvents="none"
      testID={`activity-icon-${name}`}
      nativeID={`activity-icon-rattled-${rattle}-popped-${pop}`}
    >
      <Image source={source} style={styles.fill} accessibilityIgnoresInvertColors />
      <Animated.View
        style={[styles.fill, styles.glow, { backgroundColor: colors.onInverse }, glowStyle]}
      />
    </Animated.View>
  );
}

/** The full-bar moment's caption, above the bar. Fades out after a few seconds. */
export function MomentCaption() {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const opacity = useSharedValue(0);

  useEffect(() => {
    const show = (caption: string) => {
      setText(caption);
      opacity.value = withSequence(
        withTiming(1, { duration: m.captionFadeMs }),
        withDelay(m.captionMs, withTiming(0, { duration: m.captionFadeMs })),
      );
    };
    const offMoment = onPetMomentStart((moment) => {
      if (moment.kind !== 'react' && moment.caption) show(moment.caption);
    });
    // Narrator lines without a pet moment (Explore, P2-16).
    const offAnnounce = onAnnounce(show);
    return () => {
      offMoment();
      offAnnounce();
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[styles.caption, { backgroundColor: colors.surfaceSheet }, style]}
      pointerEvents="none"
      testID="moment-caption"
      accessibilityLiveRegion="polite"
      aria-live="polite"
    >
      <Text style={[styles.captionText, { color: colors.onSurface }]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  glow: { borderRadius: 999 },
  caption: {
    position: 'absolute',
    bottom: '100%',
    alignSelf: 'center',
    marginBottom: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  captionText: { ...textStyle('label'), textAlign: 'center' },
});
