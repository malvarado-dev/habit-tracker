// Where the last Coin-earning tap happened, so flying coins start from that card (P2-08c).
// A plain module value: the tap writes it, the Coin bar reads it once. Nothing re-renders.

let origin: { x: number; y: number } | null = null;

/** Called on press in, before the log lands, with the tap's screen position. */
export function noteCoinOrigin(x: number, y: number): void {
  origin = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** The last tap's position, used once. Null means start from the bottom of the screen. */
export function takeCoinOrigin(): { x: number; y: number } | null {
  const o = origin;
  origin = null;
  return o;
}

// History edits earn Coins quietly (P2-18b): no Coin bar, the balance just updates.
let quiet = false;

/** Called right before a History edit, so the Coin bar skips its show for that change. */
export function noteQuietCoins(): void {
  quiet = true;
}

/** True once after a History edit; clears it. */
export function takeQuietCoins(): boolean {
  const q = quiet;
  quiet = false;
  return q;
}
