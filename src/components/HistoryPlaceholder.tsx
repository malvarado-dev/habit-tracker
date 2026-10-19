// History placeholder for the wide layout (T10, Figma "Today · Wide"): a dashed card with an
// empty grid of day tiles. History itself is out of scope for the prototype.

import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import { wideLayout as wide, type ThemeColors } from '@/design/tokens';
import { radius, space } from '@/theme';

export function HistoryPlaceholder() {
  const styles = useStyles();
  return (
    <View
      style={styles.card}
      testID="history-placeholder"
      accessible
      accessibilityLabel="History, coming later"
    >
      <Text style={styles.label}>HISTORY · PLACEHOLDER</Text>
      <View style={styles.grid} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: wide.historyRows }, (_, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: wide.historyColumns }, (_, c) => (
              <View key={c} style={styles.tile} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: wide.sceneRadius,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.onSurfaceMuted,
      backgroundColor: c.surfaceDim,
      padding: space.lg,
      gap: space.md,
    },
    label: { ...textStyle('label'), color: c.onSurfaceMuted },
    grid: { flex: 1, gap: wide.historyGap },
    row: { flex: 1, flexDirection: 'row', gap: wide.historyGap },
    tile: { flex: 1, borderRadius: radius.md, backgroundColor: c.surface, opacity: 0.7 },
  });
