// The quest sheet (P2-15, #86, PRD-14 "Quest detail"): opened from the Main Quest card. Shows the
// narrator's story line, the goal, the reward, and one Accept button (or progress once accepted).
// Placeholder words until the narrator lines are written.

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { space } from '@/theme';

import { questProgressText } from './mainQuestText';

export const HEAL_STORY =
  'Neko came home hurt, with a sore tail and leg. A little care every day will help Neko heal.';

export function QuestSheet({
  open,
  accepted,
  done,
  onAccept,
  onClose,
}: {
  open: boolean;
  accepted: boolean;
  /** Check-in days so far, shown once accepted. */
  done: number;
  onAccept: () => void;
  onClose: () => void;
}) {
  const { colors: c } = useTheme();
  const q = tuning.quest.heal;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.backdrop,
          { backgroundColor: withAlpha(c.inverse, tuning.menu.shadeOpacity) },
        ]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID="quest-sheet-backdrop"
      />
      <View style={[styles.sheet, { backgroundColor: c.surface }]} testID="quest-sheet">
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <Text
          style={[textStyle('title', '700'), { color: c.onSurface }]}
          accessibilityRole="header"
        >
          Heal Neko
        </Text>
        <Text style={[textStyle('body'), styles.story, { color: c.onSurfaceMuted }]}>
          {HEAL_STORY}
        </Text>
        <View style={[styles.row, { borderColor: c.border }]}>
          <Text style={[textStyle('label'), { color: c.onSurfaceMuted }]}>Goal</Text>
          <Text style={[textStyle('label', '500'), { color: c.onSurface }]}>
            {q.goal} check-in days
          </Text>
        </View>
        <View style={[styles.row, { borderColor: c.border }]}>
          <Text style={[textStyle('label'), { color: c.onSurfaceMuted }]}>Reward</Text>
          <Text style={[textStyle('label', '500'), { color: c.onSurface }]}>
            Love +{q.rewardLove}, Confidence +{q.rewardConfidence}
          </Text>
        </View>
        {accepted ? (
          <Text
            style={[textStyle('label', '500'), styles.progress, { color: c.onSurface }]}
            testID="quest-sheet-progress"
          >
            {questProgressText(done, q.goal, 'days')}
          </Text>
        ) : (
          <Pressable
            onPress={onAccept}
            style={[styles.accept, { backgroundColor: c.primary }]}
            testID="quest-accept"
            accessibilityRole="button"
          >
            <Text style={[textStyle('habitName', '700'), { color: c.onPrimary }]}>Accept</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: space.xl,
    paddingBottom: space.xl * 2,
    gap: space.sm,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: space.sm },
  story: { marginBottom: space.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  progress: { textAlign: 'center', marginTop: space.lg },
  accept: {
    marginTop: space.lg,
    paddingVertical: space.md,
    borderRadius: 9999,
    alignItems: 'center',
  },
});
