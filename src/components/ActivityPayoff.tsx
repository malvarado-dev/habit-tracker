// The full-bar moment's caption fades above the smooth Activity Bar (#137).
// Every timing lives in tuning.pet.moments.

import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { onAnnounce, onPetMomentStart } from '@/scene/petMoments';

const m = tuning.pet.moments;

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
