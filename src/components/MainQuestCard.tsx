// Main Quest card under the Activity Bar (P2-07, P2-15): the one quest's name and where it stands.
// New: "New quest" with a dot; tapping opens the Accept sheet. Active: "3/7 Check in days" and a
// progress bar. Done: Claim (the whole card claims). Claimed: the card is gone (the habit sheet leaves it out).

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { cardEdge } from '@/design/tokens';
import type { HealStatus } from '@/rules/quest';
import { MIN_TAP_SIZE, space } from '@/theme';

import { questProgressText, type QuestUnit } from './mainQuestText';

type Props = {
  name: string;
  status: Exclude<HealStatus, 'claimed'>;
  done: number;
  total: number;
  unit: QuestUnit;
  /** Opens the quest's sheet (story, goal, reward, Accept). */
  onOpen: () => void;
  onClaim: () => void;
  /**
   * Home without the sheet (#133): a small one-line pill in the top bar, next to the Menu button,
   * floating over the room. Same states and test IDs.
   */
  compact?: boolean;
};

export function MainQuestCard(props: Props) {
  const { name, status, done, total, unit, onOpen, onClaim, compact = false } = props;
  const { colors: c, scheme } = useTheme();
  const share = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const progress = status === 'new' ? 'New quest' : questProgressText(done, total, unit);
  return (
    <Pressable
      testID="main-quest-card"
      // Done: the whole card claims, so there's no button inside a button.
      onPress={status === 'done' ? onClaim : onOpen}
      accessibilityRole="button"
      accessibilityHint={
        status === 'new'
          ? 'Opens the quest to accept it.'
          : status === 'done'
            ? 'Claims the reward.'
            : 'Opens the quest.'
      }
      style={[
        compact ? styles.pill : styles.card,
        { backgroundColor: c.surface },
        cardEdge(scheme, c.border),
        compact && { boxShadow: tuning.scene.floatShadow },
      ]}
    >
      <View style={compact ? styles.pillWords : styles.words}>
        <Text
          numberOfLines={1}
          style={[textStyle(compact ? 'label' : 'habitName', '700'), { color: c.onSurface }]}
          testID="main-quest-name"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={[textStyle(compact ? 'caption' : 'label', '500'), { color: c.onSurfaceMuted }]}
          testID="main-quest-progress"
        >
          {progress}
        </Text>
      </View>
      {status === 'new' ? (
        <View
          style={[styles.dot, { backgroundColor: c.scoreOnTrackStar }]}
          testID="main-quest-dot"
          aria-hidden
        />
      ) : status === 'done' ? (
        <View
          style={[compact ? styles.pillClaim : styles.claim, { backgroundColor: c.primary }]}
          testID="main-quest-claim"
        >
          <Text style={[textStyle('label', '700'), { color: c.onPrimary }]}>Claim</Text>
        </View>
      ) : (
        <View
          style={[compact ? styles.pillTrack : styles.track, { backgroundColor: c.surfaceDim }]}
          testID="main-quest-bar"
        >
          <View
            testID="main-quest-fill"
            style={[styles.fill, { width: `${share * 100}%`, backgroundColor: c.scoreOnTrackStar }]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderRadius: 24,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
  words: { flex: 1, gap: 2 },
  track: { width: '38%', height: 10, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  claim: { paddingHorizontal: space.xl, paddingVertical: space.sm, borderRadius: 9999 },
  pill: {
    minHeight: MIN_TAP_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: 9999,
    paddingHorizontal: space.md + 2,
  },
  pillWords: { flexShrink: 1, flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  pillTrack: { width: 54, height: 6, borderRadius: 9999, overflow: 'hidden' },
  pillClaim: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: 9999 },
});
