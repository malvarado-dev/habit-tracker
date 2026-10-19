// The subtle, see-through menu button, top left of the Background (SPEC-00). 44 pt tap area,
// on-sky colors with 3:1 contrast. For now it opens Habits; T11 adds the side menu and Profile.

import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { withAlpha } from '@/design/theme/theme';
import { background as sky } from '@/design/tokens';
import type { SkyTime } from '@/rules/sky';

export function MenuButton({ time }: { time: SkyTime }) {
  const ink = time === 'day' ? sky.onSkyDay : sky.onSkyDark;
  return (
    <Link href="/habits" asChild>
      <Pressable
        style={[styles.button, { backgroundColor: withAlpha(ink, 0.12) }]}
        testID="menu-button"
        accessibilityRole="button"
        accessibilityLabel="Menu"
      >
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.line, { backgroundColor: ink }]} />
        ))}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  line: { width: 18, height: 2, borderRadius: 1 },
});
