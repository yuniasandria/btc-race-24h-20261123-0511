# btc-race-24h-20261123-0511

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/yuniasandria/btc-race-24h-20261123-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/yuniasandria/btc-race-24h-20261123-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

Breakout rider: a long-only 1-minute cbBTC trend bot for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $50 in USDC. It buys the whole cash balance when the close prints a new 45-bar high, rides the move with a trailing stop 250 bps below the peak close since entry, and waits 480 bars after any exit before it may enter again. A full round trip costs roughly 45 bps in fees, slippage and pool impact, so it trades rarely and only on a real breakout; in a falling market the 45-bar high is rarely broken, so it mostly sits in cash.

## Run it

```sh
node main.ts
```

The bot speaks agent-fun/bars-replay/v1 on stdin/stdout (Node 22, standard library plus the vendored `vendor/makefun-bars.ts` shim). Grade it locally with the kit:

```sh
node cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=6cmdpsm5&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
