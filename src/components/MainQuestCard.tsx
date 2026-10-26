// Main Quest card under the Activity Bar (P2-07): the one active quest's name, "0/7 Check in days"
// (or "0/3 Check in streak"), and a progress bar. The quest data comes from P2-15 (#86); until
// then the habit sheet passes a Heal Neko placeholder.

import { StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { cardEdge } from '@/design/tokens';
import { space } from '@/theme';

import { questProgressText, type QuestUnit } from './mainQuestText';

type Props = { name: string; done: number; total: number; unit: QuestUnit };

export function MainQuestCard({ name, done, total, unit }: Props) {
  const { colors: c, scheme } = useTheme();
  const share = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const progress = questProgressText(done, total, unit);
  return (
    <View
      testID="main-quest-card"
      accessible
      accessibilityLabel={`${name}, ${progress}`}
      style={[styles.card, { backgroundColor: c.surface }, cardEdge(scheme, c.border)]}
    >
      <View style={styles.words}>
        <Text
          style={[textStyle('habitName', '700'), { color: c.onSurface }]}
          testID="main-quest-name"
        >
          {name}
        </Text>
        <Text
          style={[textStyle('label', '500'), { color: c.onSurfaceMuted }]}
          testID="main-quest-progress"
        >
          {progress}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.surfaceDim }]} testID="main-quest-bar">
        <View
          testID="main-quest-fill"
          style={[styles.fill, { width: `${share * 100}%`, backgroundColor: c.scoreOnTrackStar }]}
        />
      </View>
    </View>
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
});
