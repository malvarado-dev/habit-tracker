// The Today layout (T23). Phone and tablet portrait (#133): the living room fills the whole screen
// and the habit list floats over it with no sheet (HabitSheet's floating mode). A corner button
// (Menu) sits top left. Wide (T10, desktop web
// and iPad landscape): the page is the sheet color, with the sheet on the left and, on the right,
// the Background as a rounded card with the critter above History (T16).

import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components/Background';
import { Critter } from '@/components/Critter';
import { ExploreScene } from '@/components/ExploreScene';
import { RoomScene } from '@/components/RoomScene';
import type { FloatingLayout } from '@/components/HabitSheet';
import { roomGeometry } from '@/scene/roomGeometry';
import type { PetPlace } from '@/rules/petPlace';
import { HistoryEditScope } from '@/components/history/HistoryEditScope';
import { HistoryView } from '@/components/history/HistoryView';
import { layoutMode, wideSizes } from '@/components/todayLayoutMode';
import { useTheme } from '@/design/theme/ThemeProvider';
import { wideLayout as wide, type ThemeColors } from '@/design/tokens';
import { MIN_TAP_SIZE, space } from '@/theme';

const CRITTER_ASPECT = 260 / 360;

type CritterProps = Omit<ComponentProps<typeof Critter>, 'width'>;

type Props = {
  /** The screen's test ID, on the outer view in both layouts. */
  testID: string;
  critter: CritterProps;
  /** Where the pet is in the living room (P2-12). Phone and tablet portrait only. */
  pet: PetPlace;
  /** The pet is out exploring (P2-16): the neighborhood replaces the living room. */
  exploring?: boolean;
  /** The top-left button. `onPage` is true on wide, where it sits on the sheet color. */
  corner: (onPage: boolean) => ReactNode;
  /**
   * The habit list. `bottomPadding` keeps the last card clear of the home indicator. On phone and
   * tablet portrait `floating` says where the list floats over the room (#133); wide leaves it out.
   */
  sheet: (layout: { bottomPadding: number; floating?: FloatingLayout }) => ReactNode;
  /** Drawn last, over everything (the side menu). */
  overlay?: ReactNode;
};

export function SceneLayout({
  testID,
  critter,
  pet,
  exploring = false,
  corner,
  sheet,
  overlay,
}: Props) {
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
            {sheet({ bottomPadding: space.xl })}
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
            <HistoryEditScope>
              <ScrollView
                style={styles.history}
                contentContainerStyle={styles.historyContent}
                testID="wide-history"
              >
                <HistoryView />
              </ScrollView>
            </HistoryEditScope>
          </View>
        </View>
        {overlay}
      </View>
    );
  }

  // Phone and iPad portrait (#133): the living room fills the screen and the habit list floats over
  // it, with no sheet. The Menu button is drawn last so the list's strip never covers it.
  const room = roomGeometry(width, height, insets.top);
  const cornerTop = insets.top + space.sm;
  const cornerLeft = insets.left + space.lg;

  return (
    <View style={styles.screen} testID={testID}>
      {/* The room never scrolls; it sits behind everything. */}
      {exploring ? (
        <ExploreScene width={width} sceneHeight={room.listTop} time={time} />
      ) : (
        <RoomScene geometry={room} pet={pet} />
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="habit-sheet">
        {sheet({
          bottomPadding: insets.bottom + space.xl,
          floating: {
            listTop: room.listTop,
            stuckTop: room.stuckTop,
            topBarTop: cornerTop,
            questLeft: cornerLeft + MIN_TAP_SIZE + space.sm,
            left: insets.left + space.lg,
            right: insets.right + space.lg,
            screenHeight: height,
          },
        })}
      </View>

      <View style={[styles.corner, { top: cornerTop, left: cornerLeft }]}>{corner(false)}</View>
      {overlay}
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, overflow: 'hidden' },
    critter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    corner: { position: 'absolute' },
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
