// Today (SPEC-00). Phone and tablet portrait: the Background fills the whole screen with the
// critter standing near the top, and the habit sheet sits fixed over the lower part; cards
// scroll inside it while the Background stays put. No header; the subtle menu button sits top
// left. Wide (T10, desktop web and iPad landscape): the page is the sheet color, with the
// habits on the left and, on the right, the Background as a rounded card with the critter
// above History (T16), which replaced the placeholder.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/Background';
import { Critter } from '@/components/Critter';
import { useCritterAndMoment } from '@/components/useCritterAndMoment';
import { HabitSheet } from '@/components/HabitSheet';
import { HistoryView } from '@/components/history/HistoryView';
import { MenuButton } from '@/components/MenuButton';
import { SideMenu } from '@/components/SideMenu';
import { layoutMode, wideSizes } from '@/components/todayLayoutMode';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, wideLayout as wide, type ThemeColors } from '@/design/tokens';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { getDailyResult } from '@/rules/scoring';
import { getSkyLevel, getSkyTime } from '@/rules/sky';
import { space } from '@/theme';

const CRITTER_ASPECT = 260 / 360;

export default function HomeScreen() {
  const styles = useStyles();
  const { state, today } = useTracker();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const result = getDailyResult(state.habits, state.log, today);
  const skyLevel = getSkyLevel(result);
  const skyTime = getSkyTime(new Date().getHours());
  const reactKey = JSON.stringify(state.log[today] ?? {});
  const { woken, wake, moment } = useCritterAndMoment(result, today, reactKey);
  const critterProps = { level: skyLevel, woken, onWake: wake, time: skyTime, reactKey, moment };

  const [menuOpen, setMenuOpen] = useState(false);
  const menu = <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />;

  if (layoutMode(width, height) === 'wide') {
    const { sceneHeight, critterWidth } = wideSizes(width, height);
    const critterHeight = critterWidth * CRITTER_ASPECT;
    return (
      <View style={[styles.screen, styles.wideScreen]} testID="today-screen">
        {/* Capped at wideLayout.maxWidth and centered, so big monitors don't stretch it (#51). */}
        <View style={styles.widePage} testID="wide-page">
          <View style={styles.leftColumn} testID="habit-sheet">
            <MenuButton time={skyTime} onPage onPress={() => setMenuOpen(true)} />
            <HabitSheet bottomPadding={space.xl} />
          </View>
          <View style={styles.rightColumn} testID="wide-right-column">
            <View style={[styles.scene, { height: sceneHeight }]} testID="background-card">
              <Background time={skyTime} level={skyLevel} moment={moment} />
              <View
                style={[styles.critter, { bottom: -critterHeight * wide.critterSink }]}
                pointerEvents="box-none"
              >
                <Critter width={critterWidth} {...critterProps} />
              </View>
            </View>
            <ScrollView
              style={styles.history}
              contentContainerStyle={styles.historyContent}
              testID="wide-history"
            >
              <HistoryView
                onOpenDay={(date) =>
                  router.push({ pathname: '/day/[date]', params: { date, from: 'today' } })
                }
              />
            </ScrollView>
          </View>
        </View>
        {menu}
      </View>
    );
  }

  const sheetTop = Math.round(height * todayLayout.sheetTopRatio);
  const critterWidth = Math.min(width * todayLayout.critterWidthRatio, todayLayout.critterMaxWidth);
  const critterHeight = critterWidth * CRITTER_ASPECT;

  return (
    <View style={styles.screen} testID="today-screen">
      {/* The Background never scrolls; it sits behind everything. */}
      <Background time={skyTime} level={skyLevel} moment={moment} />

      <View
        style={[styles.critter, { top: sheetTop + todayLayout.critterOverlap - critterHeight }]}
        pointerEvents="box-none"
      >
        <Critter width={critterWidth} {...critterProps} />
      </View>

      <View style={[styles.menu, { top: insets.top + space.sm, left: insets.left + space.lg }]}>
        <MenuButton time={skyTime} onPress={() => setMenuOpen(true)} />
      </View>

      <View style={[styles.sheet, { top: sheetTop }]} testID="habit-sheet">
        <View style={styles.sheetInner}>
          <HabitSheet bottomPadding={insets.bottom + space.xl} />
        </View>
      </View>
      {menu}
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

// habit-sheet in design-system.md: solid sheet color, 28 pt top corners, 16 pt padding.
const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, overflow: 'hidden' },
    critter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    menu: { position: 'absolute' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
    sheetInner: {
      flex: 1,
      width: '100%',
      maxWidth: todayLayout.sheetMaxWidth,
      backgroundColor: c.surfaceSheet,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: space.lg,
      paddingHorizontal: space.lg,
      gap: space.md,
    },
    wideScreen: { backgroundColor: c.surfaceSheet, alignItems: 'center' },
    widePage: {
      flex: 1,
      width: '100%',
      maxWidth: wide.maxWidth,
      flexDirection: 'row',
      padding: wide.pagePadding,
      gap: wide.columnGap,
    },
    leftColumn: { width: wide.leftColumnWidth, gap: space.lg },
    rightColumn: { flex: 1, gap: wide.columnGap },
    scene: { borderRadius: wide.sceneRadius, overflow: 'hidden' },
    history: { flex: 1 },
    historyContent: { paddingBottom: space.lg },
  });
