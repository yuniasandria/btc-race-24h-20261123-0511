// Breakout rider: a long-only 1-minute cbBTC trend bot for agent-fun/bars-replay/v1.
//
// Idea: on 1-minute bars the pool price moves only when someone trades, so most
// bars are flat and the signal is slow. A full round trip costs roughly 45 bps
// (4 bps fee + 2 bps slippage + ~17 bps of pool impact each way at the depths
// this window shows), so the bot trades rarely and only on a real breakout:
// it buys the whole cash balance when the close prints a new 45-bar high, then
// rides the move with a trailing stop 250 bps below the highest close since
// entry. After any exit it waits 480 bars (8 hours) before it may enter again,
// so a choppy or falling day cannot bleed it through repeated stop-outs. In a
// falling market the 45-bar high is rarely broken at all, so the bot mostly
// sits in cash and keeps its $1,000.
//
// All decisions use integer (bigint) arithmetic on the closes the harness sends,
// so two runs on the same data produce the same replies byte for byte: no
// clock, no environment, no randomness.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
/** A breakout needs the close at or above the highest high of this many bars. */
const LOOKBACK_BARS = 45;
/** Exit when the close falls this far (bps) below the peak close since entry. */
const TRAIL_BPS = 250n;
/** Bars to wait after deciding an exit before a fresh entry may be taken. */
const COOLDOWN_BARS = 480;
/** Fills are priced off the next bar's open; 150 bps covers the largest 1-minute
 * move this window shows (~72 bps) plus slippage and the order's own impact,
 * while still refusing a fill after a genuine gap. */
const MAX_SLIPPAGE_BPS = 150;

/** Highest high of each bar seen so far, oldest first. */
const highs: bigint[] = [];
/** Bars answered so far (hello does not say how many bars the window holds). */
let barsSeen = 0;
/** Highest close since the current position opened; null while flat. */
let peakClose: bigint | null = null;
/** Seq of the batch on which the last exit was decided; entries are blocked
 * for COOLDOWN_BARS after it. */
let lastExitSeq = -1000000;

function trailLimit(peak: bigint): bigint {
  // The lowest close the position tolerates: peak * (10000 - TRAIL_BPS) / 10000.
  return (peak * (10000n - TRAIL_BPS)) / 10000n;
}

await runBars({
  onBatch(state: BarsState): OrderInput[] {
    const bar = state.latest.get(SYMBOL);
    if (bar === undefined) return [];
    const close = BigInt(bar.c);
    highs.push(BigInt(bar.h));
    barsSeen += 1;
    if (highs.length > LOOKBACK_BARS) highs.shift();

    if (state.warmingUp) return [];
    const held = state.positions.get(SYMBOL);
    const inPosition = held !== undefined && held.qty > 0n;

    if (inPosition) {
      if (peakClose === null || close > peakClose) peakClose = close;
      if (peakClose !== null && close < trailLimit(peakClose)) {
        lastExitSeq = state.seq;
        peakClose = null;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    peakClose = null;
    // The backtest's first tradable bar is the 46th: only then does a full
    // 45-bar window sit strictly behind the current bar.
    if (barsSeen <= LOOKBACK_BARS) return [];
    if (state.seq - lastExitSeq < COOLDOWN_BARS) return [];
    let windowHigh = 0n;
    for (const h of highs) if (h > windowHigh) windowHigh = h;
    if (close < windowHigh) return [];
    const spend = state.equity < state.cash ? state.equity : state.cash;
    if (spend < BigInt(state.hello.fees.min_notional_quote_units)) return [];
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: spend, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  },
});
