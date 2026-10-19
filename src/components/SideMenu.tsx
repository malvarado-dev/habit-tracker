// The side menu (SPEC-00, T11): slides in from the left over Today with Profile and Habits.
// Tapping the shade or pressing back on Android closes it. Reduced motion: no slide.

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const PANEL_WIDTH = 280;

const ITEMS = [
  { label: 'Profile', path: '/profile', id: 'menu-profile' },
  { label: 'Habits', path: '/habits', id: 'menu-habits' },
] as const;

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);
  // Stay mounted while sliding out, then unmount so the shade never blocks taps.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const to = open ? 1 : 0;
    if (reduceMotion) {
      shown.value = to;
      return;
    }
    shown.value = withTiming(to, { duration: tuning.menu.slideMs }, (done) => {
      if (done && to === 0) runOnJS(setMounted)(false);
    });
  }, [open, reduceMotion, shown]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const shadeStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (shown.value - 1) * PANEL_WIDTH }],
  }));

  if (!open && (!mounted || reduceMotion)) return null;

  const go = (path: '/profile' | '/habits') => {
    onClose();
    router.push(path);
  };

  return (
    <View style={StyleSheet.absoluteFill} testID="side-menu">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.inverse, tuning.menu.shadeOpacity) },
          shadeStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          testID="side-menu-shade"
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
      </Animated.View>
      <Animated.View
        style={[styles.panel, { paddingTop: insets.top + space.xl }, panelStyle]}
        accessibilityViewIsModal
      >
        <Text style={styles.title} accessibilityRole="header">
          Menu
        </Text>
        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => go(item.path)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            testID={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={styles.rowText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    panel: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: PANEL_WIDTH,
      backgroundColor: c.surfaceSheet,
      borderTopRightRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: space.lg,
      gap: space.md,
    },
    title: { ...textStyle('label'), color: c.onSurfaceMuted, marginBottom: space.xs },
    row: {
      minHeight: MIN_TAP_SIZE + space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.7 },
    rowText: { ...textStyle('habitName'), color: c.onSurface },
    chevron: { ...textStyle('habitName'), color: c.onSurfaceMuted },
  });
