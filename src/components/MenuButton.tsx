// The subtle, see-through menu button, top left of the Background (SPEC-00). 44 pt tap area,
// on-sky colors with 3:1 contrast. On the wide layout it sits on the page instead, as a card-white
// circle in the theme colors. Opens the side menu (T11).

import { Pressable, StyleSheet, View } from 'react-native';

import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import { background as sky } from '@/design/tokens';
import type { SkyTime } from '@/rules/sky';

export function MenuButton({
  time,
  onPress,
  onPage = false,
}: {
  time: SkyTime;
  onPress: () => void;
  onPage?: boolean;
}) {
  const { colors } = useTheme();
  const skyInk = time === 'day' ? sky.onSkyDay : sky.onSkyDark;
  const ink = onPage ? colors.onSurface : skyInk;
  const look = onPage
    ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
    : { backgroundColor: withAlpha(skyInk, 0.12) };
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, look]}
      testID="menu-button"
      accessibilityRole="button"
      accessibilityLabel="Menu"
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.line, { backgroundColor: ink }]} />
      ))}
    </Pressable>
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
