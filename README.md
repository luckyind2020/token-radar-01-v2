# token-radar-01-v2

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/luckyind2020/token-radar-01-v2/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/luckyind2020/token-radar-01-v2/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar v2 — every pre-token protocol ranked by what its launch would be worth, with a concrete farm plan for each one. It reads a sealed DefiLlama snapshot (758 protocols, 40 on the watchlist) and builds a ranked board plus a self-contained dashboard. The implied value is TVL × peer multiple × growth × age × chains, where the peer multiple is the median market-cap/TVL ratio of the tokenized protocols in the same category, computed from the snapshot itself — never a hardcoded list of names. Protocols whose token already trades show their actual market cap; wrapped, staked or bridged products of a traded token are ranked last at 1% of peer value, because a wrapper cannot launch. Every row carries five farm steps with real costs and durations, and the dashboard recomputes every value with the same formula, so screen and board always agree.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=./input MAKEFUN_OUTPUT_DIR=./out node main.ts
```

`main.ts` needs Node 22 and nothing else (standard library only). It reads `./input/snapshot.json` and writes `./out/board.json`, `./out/dossier.json`, and the dashboard (`./out/dashboard/`) with its screenshots (`./out/screenshots/`). Open `./out/dashboard/index.html` to browse the board: sortable and filterable by status, category and chain, with a detail view per protocol showing exactly how its value was scored and how to farm it.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4ha9jy2z&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
