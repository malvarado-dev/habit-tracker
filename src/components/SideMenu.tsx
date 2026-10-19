// The side menu (SPEC-00, T11): slides in from the left over Today with Profile, Habits, and
// History (T16), then a divider and the prototype-only Test tools (T17).
// Tapping the shade, swiping the menu or shade left (T25), or pressing back on Android closes it.
// No edge swipe to open. Reduced motion: no slide, and the panel doesn't follow the finger.

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHOW_TEST_TOOLS } from '@/config/prototype';
import { tuning } from '@/config/tuning';
import { textStyle } from '@/design/fonts';
import { withAlpha } from '@/design/theme/theme';
import { useTheme } from '@/design/theme/ThemeProvider';
import type { ThemeColors } from '@/design/tokens';
import { menuDragOffset, shouldCloseMenu } from '@/components/menuSwipe';
import { MIN_TAP_SIZE, radius, space } from '@/theme';

const PANEL_WIDTH = 280;

const ITEMS = [
  { label: 'Profile', path: '/profile', id: 'menu-profile' },
  { label: 'Habits', path: '/habits', id: 'menu-habits' },
  { label: 'History', path: '/history', id: 'menu-history' },
] as const;

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(0);
  // How far the finger has pulled the panel left, in points (0 or less).
  const drag = useSharedValue(0);
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

  const { swipeStartOffset: start } = tuning.menu;
  const swipe = usePanGesture({
    activeOffsetX: [-start, start],
    failOffsetY: [-start, start],
    onUpdate: (e) => {
      'worklet';
      if (!reduceMotion) drag.set(menuDragOffset(e.translationX, PANEL_WIDTH));
    },
    onDeactivate: (e) => {
      'worklet';
      if (shouldCloseMenu(e.translationX, e.velocityX, PANEL_WIDTH)) {
        // Hand the dragged position to the slide-out so it carries on from where the finger let go.
        shown.set(1 + drag.get() / PANEL_WIDTH);
        drag.set(0);
        runOnJS(onClose)();
      } else {
        drag.set(reduceMotion ? 0 : withTiming(0, { duration: tuning.menu.slideMs }));
      }
    },
  });

  const shadeStyle = useAnimatedStyle(() => ({
    opacity: shown.value + drag.value / PANEL_WIDTH,
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (shown.value - 1) * PANEL_WIDTH + drag.value }],
  }));

  if (!open && (!mounted || reduceMotion)) return null;

  const go = (path: (typeof ITEMS)[number]['path'] | '/test-tools') => {
    onClose();
    // Habits and History name where Back goes; from the menu that's Today.
    router.push(
      path === '/profile' || path === '/test-tools'
        ? path
        : { pathname: path, params: { from: 'today' } },
    );
  };

  return (
    <GestureDetector gesture={swipe}>
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
          {/* Prototype only (T17); see TestTools.tsx for how to remove. */}
          {SHOW_TEST_TOOLS ? (
            <>
              <View style={styles.divider} importantForAccessibility="no" />
              <Pressable
                onPress={() => go('/test-tools')}
                style={({ pressed }) => [styles.row, styles.testRow, pressed && styles.pressed]}
                testID="menu-test-tools"
                accessibilityRole="button"
                accessibilityLabel="Test tools, prototype only"
              >
                <View>
                  <Text style={styles.rowText}>Test tools</Text>
                  <Text style={styles.rowSub}>Prototype only</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </>
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
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
    divider: { height: 1, backgroundColor: c.border, marginVertical: space.sm },
    testRow: { borderStyle: 'dashed', borderColor: c.onSurfaceMuted, paddingVertical: space.xs },
    rowSub: { ...textStyle('caption'), color: c.onSurfaceMuted },
  });
