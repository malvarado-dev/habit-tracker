// Placeholder critter (critter.md): a flat sunny dome with eyes and a mouth, its body running
// behind the habit sheet. Asleep before the first check-in. Tap plays a small wiggle.
// T8 replaces this with the real critter (breathing, blinking, glancing).

import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { tuning } from '@/config/tuning';
import { critter } from '@/design/tokens';

export function Critter({ width, asleep }: { width: number; asleep: boolean }) {
  const reduceMotion = useReducedMotion();
  const turn = useSharedValue(0);
  const height = width * (260 / 360);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  const wiggle = () => {
    if (reduceMotion) return;
    const { wiggleDegrees: d, wiggleMs: ms } = tuning.critter;
    turn.value = withSequence(
      withTiming(-d, { duration: ms }),
      withTiming(d, { duration: ms * 2 }),
      withTiming(0, { duration: ms }),
    );
  };

  return (
    <Pressable
      onPress={wiggle}
      testID="critter"
      accessibilityRole="button"
      accessibilityLabel={
        asleep ? 'Your critter is asleep. Check in to wake it up.' : 'Your critter is awake.'
      }
      accessibilityHint="Tap to make it wiggle."
    >
      <Animated.View style={style}>
        <Svg width={width} height={height} viewBox="0 0 360 260">
          <Path
            d="M0 260 L0 170 Q0 30 180 30 Q360 30 360 170 L360 260 Z"
            fill={critter.bodySunny}
          />
          {asleep ? (
            <>
              <Path
                d="M140 105 Q150 113 160 105"
                stroke={critter.ink}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M200 105 Q210 113 220 105"
                stroke={critter.ink}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M170 140 Q180 144 190 140"
                stroke={critter.ink}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <Circle cx={150} cy={105} r={10} fill={critter.ink} />
              <Circle cx={210} cy={105} r={10} fill={critter.ink} />
              <Path
                d="M154 127 Q180 129 206 127 Q202 157 180 157 Q158 157 154 127 Z"
                fill={critter.ink}
              />
              <Path
                d="M168 149 Q180 141 192 149 Q188 157 180 157 Q172 157 168 149 Z"
                fill={critter.mouth}
              />
            </>
          )}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
