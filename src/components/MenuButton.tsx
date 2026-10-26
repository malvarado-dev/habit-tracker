// The subtle, see-through menu button, top left over the living room (SPEC-00, P2-06). 44 pt tap
// area, fixed room colors with 3:1 contrast (the room never changes with the theme). On the wide layout it sits on the page instead, as a card-white
// circle in the theme colors. Opens the side menu (T11).

import { Pressable, StyleSheet, View } from 'react-native';

import { tuning } from '@/config/tuning';

import { useTheme } from '@/design/theme/ThemeProvider';
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
  const ink = onPage ? colors.onSurface : tuning.scene.menuInk;
  const look = onPage
    ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
    : { backgroundColor: tuning.scene.menuButton };
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
