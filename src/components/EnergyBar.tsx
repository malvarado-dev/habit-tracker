// Energy bar at the top of the habit sheet: how much of today is checked in, with no text
// on screen (SPEC-00). T7 adds the checkered flag and the smooth fill.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design/theme/ThemeProvider';

export function EnergyBar({ checkedIn, due }: { checkedIn: number; due: number }) {
  const { colors } = useTheme();
  const fraction = due === 0 ? 1 : checkedIn / due;
  return (
    <View
      testID="energy-bar"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${checkedIn} of ${due} habits checked in`}
      accessibilityValue={{ min: 0, max: due, now: checkedIn }}
      style={[styles.track, { backgroundColor: colors.track }]}
    >
      <View
        testID="energy-fill"
        style={[
          styles.fill,
          { width: `${Math.round(fraction * 100)}%`, backgroundColor: colors.primary },
        ]}
      />
    </View>
  );
}

// energy-bar component in design-spendio.md: 14 pt dark pill, 3 pt padding, 8 pt fill.
const styles = StyleSheet.create({
  track: { height: 14, padding: 3, borderRadius: 9999 },
  fill: { height: 8, borderRadius: 9999 },
});
