// The scene layout shared by Today and the Day screen (T23). Phone and tablet portrait: the
// Background fills the whole screen with the critter standing near the top, and the habit sheet
// sits fixed over the lower part; cards scroll inside it while the Background stays put. A corner
// button (Menu on Today, Back on the Day screen) sits top left on the sky. Wide (T10, desktop web
// and iPad landscape): the page is the sheet color, with the sheet on the left and, on the right,
// the Background as a rounded card with the critter above History (T16).

import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/Background';
import { Critter } from '@/components/Critter';
import { RoomScene } from '@/components/RoomScene';
import { roomGeometry } from '@/scene/roomGeometry';
import { HistoryView } from '@/components/history/HistoryView';
import { layoutMode, wideSizes } from '@/components/todayLayoutMode';
import { useTheme } from '@/design/theme/ThemeProvider';
import { todayLayout, wideLayout as wide, type ThemeColors } from '@/design/tokens';
import type { DateKey } from '@/rules/dates';
import { space } from '@/theme';

const CRITTER_ASPECT = 260 / 360;

type CritterProps = Omit<ComponentProps<typeof Critter>, 'width'>;

type Props = {
  /** The screen's test ID, on the outer view in both layouts. */
  testID: string;
  critter: CritterProps;
  /** The top-left button. `onPage` is true on wide, where it sits on the sheet color. */
  corner: (onPage: boolean) => ReactNode;
  /** The sheet's contents. `bottomPadding` keeps the last card clear of the home indicator. */
  sheet: (bottomPadding: number) => ReactNode;
  /** Wide only: tapping a day in History. */
  onOpenDay: (date: DateKey) => void;
  /** Drawn last, over everything (the side menu). */
  overlay?: ReactNode;
};

export function SceneLayout({ testID, critter, corner, sheet, onOpenDay, overlay }: Props) {
  const styles = useStyles();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { time, level } = critter;

  if (layoutMode(width, height) === 'wide') {
    const { sceneHeight, critterWidth } = wideSizes(width, height);
    const critterHeight = critterWidth * CRITTER_ASPECT;
    return (
      <View style={[styles.screen, styles.wideScreen]} testID={testID}>
        {/* Capped at wideLayout.maxWidth and centered, so big monitors don't stretch it (#51). */}
        <View style={styles.widePage} testID="wide-page">
          <View style={styles.leftColumn} testID="habit-sheet">
            {corner(true)}
            {sheet(space.xl)}
          </View>
          <View style={styles.rightColumn} testID="wide-right-column">
            <View style={[styles.scene, { height: sceneHeight }]} testID="background-card">
              <Background time={time} level={level} />
              <View
                style={[styles.critter, { bottom: -critterHeight * wide.critterSink }]}
                pointerEvents="box-none"
              >
                <Critter width={critterWidth} {...critter} />
              </View>
            </View>
            <ScrollView
              style={styles.history}
              contentContainerStyle={styles.historyContent}
              testID="wide-history"
            >
              <HistoryView onOpenDay={onOpenDay} />
            </ScrollView>
          </View>
        </View>
        {overlay}
      </View>
    );
  }

  // Phone and iPad portrait: the living room fills the screen behind the sheet (P2-06).
  const room = roomGeometry(width, height, insets.top);
  const sheetTop = room.sheetTop;

  return (
    <View style={styles.screen} testID={testID}>
      {/* The room never scrolls; it sits behind everything. */}
      <RoomScene geometry={room} petSpot="room" />

      <View style={[styles.corner, { top: insets.top + space.sm, left: insets.left + space.lg }]}>
        {corner(false)}
      </View>

      <View style={[styles.sheet, { top: sheetTop }]} testID="habit-sheet">
        <View style={styles.sheetInner}>{sheet(insets.bottom + space.xl)}</View>
      </View>
      {overlay}
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
    corner: { position: 'absolute' },
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
