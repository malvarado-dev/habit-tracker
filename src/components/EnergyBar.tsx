// Energy bar at the top of the habit sheet: today's score, with no text on screen (SPEC-00).
// Every star moves the lemon fill. A checkered flag stands on the bar at the S cutoff (90%),
// like a finish line; 100% means 3 stars on everything that counts today (decided 2026-10-18).

import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { useTheme } from '@/design/theme/ThemeProvider';

import { clampEnergy, energyLabel, flagPosition } from './energyBarText';

type Props = {
  /** 0 to 1, from getEnergy. */
  energy: number;
  earnedStars: number;
  possibleStars: number;
  isRestDay: boolean;
};

export function EnergyBar({ energy, earnedStars, possibleStars, isRestDay }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const fraction = clampEnergy(energy);
  const [trackWidth, setTrackWidth] = useState(0);
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    const target = fraction * innerWidth;
    fillWidth.value =
      reduceMotion || innerWidth === 0
        ? target
        : withTiming(target, { duration: tuning.energy.fillMs, easing: Easing.out(Easing.cubic) });
  }, [fraction, innerWidth, reduceMotion, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  // The pole's center sits on the S cutoff of the fill area.
  const flagLeft = TRACK_PADDING + innerWidth * flagPosition() - POLE_WIDTH / 2;

  return (
    <View
      testID="energy-bar"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={energyLabel(earnedStars, possibleStars, isRestDay)}
      accessibilityValue={isRestDay ? undefined : { min: 0, max: possibleStars, now: earnedStars }}
      style={styles.wrap}
    >
      <View onLayout={onTrackLayout} style={[styles.track, { backgroundColor: colors.track }]}>
        <Animated.View
          testID="energy-fill"
          style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]}
        />
      </View>
      {trackWidth > 0 ? (
        <View style={[styles.flag, { left: flagLeft }]}>
          <CheckeredFlag light={colors.surface} dark={colors.inverse} />
        </View>
      ) : null}
    </View>
  );
}

/** Pole plus a 4 by 3 checker, drawn in the card white and the inverse dark so it reads on both sheets. */
function CheckeredFlag({ light, dark }: { light: string; dark: string }) {
  const cols = 4;
  const rows = 3;
  const cell = 3;
  const left = 2;
  const squares = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      squares.push(
        <Rect
          key={`${r}-${c}`}
          x={left + c * cell}
          y={1 + r * cell}
          width={cell}
          height={cell}
          fill={(r + c) % 2 === 0 ? dark : light}
        />,
      );
    }
  }
  return (
    <View testID="energy-flag" importantForAccessibility="no-hide-descendants">
      <Svg width={FLAG_SIZE} height={FLAG_SIZE} viewBox="0 0 18 18" accessible={false}>
        <Rect x={0} y={0} width={2} height={18} rx={1} fill={dark} />
        <Rect
          x={left - 0.5}
          y={0.5}
          width={cols * cell + 1}
          height={rows * cell + 1}
          fill={light}
          stroke={dark}
          strokeWidth={1}
        />
        {squares}
      </Svg>
    </View>
  );
}

// energy-bar component in design-spendio.md: 14 pt dark pill, 3 pt padding, 8 pt fill,
// and an 18 pt checkered flag standing on the bar at the S cutoff.
const TRACK_PADDING = 3;
const TRACK_HEIGHT = 14;
const FLAG_SIZE = 18;
const POLE_WIDTH = 2;

const styles = StyleSheet.create({
  wrap: { paddingTop: FLAG_SIZE },
  track: { height: TRACK_HEIGHT, padding: TRACK_PADDING, borderRadius: 9999 },
  fill: { height: 8, borderRadius: 9999 },
  flag: { position: 'absolute', bottom: TRACK_HEIGHT },
});
