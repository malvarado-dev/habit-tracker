// The Undo bar after a log (PRD-15 History link: "The Undo bar fixes a mistaken tap right away").
// Same look as the Habits screen's Undo bar: a dark pill at the bottom with a lemon Undo button.
// The screen owns when it shows and hides; this only draws it.

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyle } from '@/design/fonts';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

export function UndoBar(props: { text: string; undoLabel: string; onUndo: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar} testID="undo-bar" accessibilityLiveRegion="polite">
        <Text style={styles.text} numberOfLines={1} testID="undo-text">
          {props.text}
        </Text>
        <Pressable
          onPress={props.onUndo}
          style={styles.button}
          testID="undo-button"
          accessibilityRole="button"
          accessibilityLabel={props.undoLabel}
        >
          <Text style={styles.action}>Undo</Text>
        </Pressable>
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
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: space.xl,
      alignItems: 'center',
      paddingHorizontal: space.lg,
    },
    bar: {
      width: '100%',
      maxWidth: 528,
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: space.xl,
      paddingRight: space.sm,
      borderRadius: radius.pill,
      backgroundColor: c.inverse,
      // undo-bar: a 1 pt border keeps the edge visible on the dark sheet.
      borderWidth: 1,
      borderColor: c.border,
    },
    text: { ...textStyle('body'), color: c.onInverse, flex: 1 },
    button: {
      minHeight: MIN_TAP_SIZE,
      minWidth: MIN_TAP_SIZE,
      paddingHorizontal: space.lg,
      justifyContent: 'center',
    },
    action: { ...textStyle('label'), color: c.primary },
  });
