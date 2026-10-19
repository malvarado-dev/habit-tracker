// Full-screen moments: the egg hatching, and the end-of-day rank. Every rank celebrates;
// C still celebrates showing up (Glossary). Tap anywhere to close.

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { Rank } from '@/rules/rank';
import { colors, font, radius, space } from '@/theme';
import { tuning } from '@/config/tuning';

export type CelebrationKind = { type: 'hatch' } | { type: 'rest' } | { type: 'rank'; rank: Rank };

const RANK_STYLE: Record<Rank, { effect: string; message: string }> = {
  S: { effect: '🎆🎇🎆', message: 'Incredible day!' },
  A: { effect: '🎉🎊🎉', message: 'Great day!' },
  B: { effect: '👏👏👏', message: 'Solid day!' },
  C: { effect: '🙌', message: 'You showed up. That counts.' },
};

export function Celebration({ kind, onClose }: { kind: CelebrationKind; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.4);

  useEffect(() => {
    scale.value = reduceMotion ? 1 : withSpring(1, { damping: tuning.celebration.popDamping });
  }, [scale, reduceMotion]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const content =
    kind.type === 'hatch'
      ? { big: '🐣', title: 'Your critter hatched!', body: 'Keep checking in to help it grow.' }
      : kind.type === 'rest'
        ? { big: '🌙', title: 'Rest day', body: 'Nothing due today. Enjoy it.' }
        : {
            big: kind.rank,
            title: `${RANK_STYLE[kind.rank].effect}`,
            body: RANK_STYLE[kind.rank].message,
          };

  return (
    <Pressable
      style={styles.backdrop}
      onPress={onClose}
      testID={`celebration-${kind.type === 'rank' ? `rank-${kind.rank}` : kind.type}`}
      accessibilityRole="button"
      accessibilityLabel={
        kind.type === 'rank'
          ? `Today's rank: ${kind.rank}. ${content.body} Tap to close.`
          : `${content.title} ${content.body} Tap to close.`
      }
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.panel, popStyle]}>
        <Text style={styles.big}>{content.big}</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{content.body}</Text>
        <Text style={styles.hint}>Tap to close</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    zIndex: 10,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    minWidth: 260,
    maxWidth: 360,
  },
  big: {
    fontSize: font.huge,
    fontWeight: '900',
    color: colors.accent,
    lineHeight: font.huge * 1.1,
  },
  title: { fontSize: font.large, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.textMuted, marginTop: space.sm, textAlign: 'center' },
  hint: { fontSize: font.small, color: colors.textMuted, marginTop: space.lg },
});
