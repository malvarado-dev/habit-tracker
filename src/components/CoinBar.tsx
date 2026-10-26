// The Coin bar (PRD-15 Scoring, P2-08c). When logs earn Coins, a bar slides down from the top
// showing the balance, coins fly from the tapped card into it, the balance counts up as each one
// lands, then the bar slides away. Quick taps add to the bar that's already showing. Undo shows the
// balance going back down, with no coins. It never takes touches, so it can't block a habit tap.
// Reduced motion: the bar fades in and out, no flying coins, and the balance changes in place.
// The coin is a placeholder drawn in code until the coin art exists.

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tuning } from '@/config/tuning';
import { takeCoinOrigin, takeQuietCoins } from '@/features/coins/coinOrigin';
import { playCoinSound } from '@/features/coins/coinSound';
import { useTracker } from '@/features/tracker/TrackerProvider';
import { totalCoins } from '@/rules/coins';
import { allHabits } from '@/rules/locking';

const BAR_HEIGHT = 44;
const COIN = 22;
const { coinFill, coinEdge, barColor, barText, flyArc } = tuning.coins;

interface Flight {
  id: number;
  from: { x: number; y: number };
  delay: number;
}

export function CoinBar() {
  const { state, mode } = useTracker();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const c = tuning.coins;

  const balance = totalCoins({ ...state, habits: allHabits(state) });
  const [shown, setShown] = useState(balance);
  const [flights, setFlights] = useState<Flight[]>([]);
  const last = useRef({ balance, mode });
  const nextId = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = useSharedValue(0);

  const barTop = insets.top + 8;
  const target = { x: width / 2 - 40, y: barTop + BAR_HEIGHT / 2 };

  const hideLater = (afterMs: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      visible.set(withTiming(0, { duration: c.barSlideMs }));
    }, afterMs);
  };

  useEffect(() => {
    const before = last.current;
    last.current = { balance, mode };
    // Switching Real and Test shows another tracker's balance: nothing was earned.
    // History edits change the balance quietly (P2-18b).
    if (before.mode !== mode || takeQuietCoins()) {
      setShown(balance);
      return;
    }
    const change = balance - before.balance;
    if (change === 0) return;
    visible.set(withTiming(1, { duration: c.barSlideMs }));

    if (change < 0 || reduceMotion) {
      setShown(balance);
      hideLater(c.barSlideMs + c.barHoldMs);
      return;
    }
    const from = takeCoinOrigin() ?? { x: width / 2, y: height - 120 };
    const flying = Math.min(change, c.maxFlying);
    const base = nextId.current;
    nextId.current += flying;
    const added: Flight[] = Array.from({ length: flying }, (_, i) => ({
      id: base + i,
      from,
      delay: c.barSlideMs / 2 + i * c.flyGapMs,
    }));
    setFlights((f) => [...f, ...added]);
    // Coins that don't fly still count: the last flyer lands with the rest of the change.
    const extra = change - flying;
    if (extra > 0) setTimeout(() => setShown((s) => s + extra), added[flying - 1]!.delay + c.flyMs);
    hideLater(added[flying - 1]!.delay + c.flyMs + c.barHoldMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, mode]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const land = (id: number) => {
    setFlights((f) => f.filter((x) => x.id !== id));
    setShown((s) => Math.min(s + 1, last.current.balance));
    playCoinSound();
  };

  const barStyle = useAnimatedStyle(() => {
    const v = visible.get();
    return reduceMotion
      ? { opacity: v }
      : { opacity: v > 0 ? 1 : 0, transform: [{ translateY: (v - 1) * (barTop + BAR_HEIGHT) }] };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.bar, { top: barTop }, barStyle]} testID="coin-bar">
        <Coin />
        <Text
          style={styles.balance}
          testID="coin-balance"
          accessibilityLabel={`${shown} Coins`}
          accessibilityLiveRegion="polite"
        >
          {shown}
        </Text>
      </Animated.View>
      {flights.map((f) => (
        <FlyingCoin key={f.id} flight={f} to={target} onLand={() => land(f.id)} />
      ))}
    </View>
  );
}

function FlyingCoin(props: { flight: Flight; to: { x: number; y: number }; onLand: () => void }) {
  const { flight, to, onLand } = props;
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        flight.delay,
        withTiming(1, { duration: tuning.coins.flyMs, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) runOnJS(onLand)();
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const p = t.get();
    // A small arc up, then into the bar.
    const x = flight.from.x + (to.x - flight.from.x) * p;
    const y = flight.from.y + (to.y - flight.from.y) * p - Math.sin(p * Math.PI) * flyArc;
    return {
      opacity: p === 0 ? 0 : 1,
      transform: [
        { translateX: x - COIN / 2 },
        { translateY: y - COIN / 2 },
        { scale: 1 - p * 0.2 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.flying, style]}>
      <Coin />
    </Animated.View>
  );
}

function Coin() {
  return (
    <View style={styles.coin}>
      <View style={styles.coinInner} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    alignSelf: 'center',
    height: BAR_HEIGHT,
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: barColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  balance: { color: barText, fontSize: 18, fontFamily: 'Urbanist_700Bold' },
  flying: { position: 'absolute', left: 0, top: 0 },
  coin: {
    width: COIN,
    height: COIN,
    borderRadius: COIN / 2,
    backgroundColor: coinFill,
    borderWidth: 2,
    borderColor: coinEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: coinEdge },
});
