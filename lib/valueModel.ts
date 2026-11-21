// valueModel.ts — the radar's value model.
//
// The board's job is to answer: if this protocol issued a token tomorrow and
// kept its current record, what would that token be worth — and which
// pre-token protocol is worth farming first?
//
// The model is derived from the snapshot's own figures only. It never names a
// protocol in advance: every input comes from the sealed snapshot.
//
//   implied value (pre-token) = TVL x peerMultiple x growth x age x chains
//   implied value (token live) = the token's actual market cap — or, when
//     the snapshot reports no market cap for that entry (287 versioned rows
//     such as Aave V3 record the parent token but no market cap), the same
//     peer-modeled value as a pre-token row, flagged mcap_reported: false
//   implied value (wrapped)   = TVL x peerMultiple x 0.01
//
// change_7d is rounded to one decimal place before the growth multiplier:
// the board displays growth to two decimals, and rounding here keeps the
// dashboard's recomputed values bit-identical to the board's.
//
// peerMultiple: the median market-cap/TVL ratio of the tokenized protocols in
// the same category, computed from this snapshot. A category with fewer than
// three tokenized peers falls back to the global median. The multiple is a
// fact about the snapshot, not a guess about any one protocol.
// growth:  1 + clamp(change_7d, -50, +150) / 300  -> 0.83x .. 1.50x
// age:     1 + 0.35 * min(ageDays, 1095) / 1095   -> 1.00x .. 1.35x
//          ageDays is days from listed_at to the snapshot date; a protocol
//          with no listed date scores 1.00x. Older pre-token protocols carry
//          more pent-up value: they have run longer with no token.
// chains:  1 + 0.03 * min(chains - 1, 6)          -> 1.00x .. 1.18x
//
// Separation (the house's own watchlist rule, from the field guide): a
// protocol that records no token is a launch candidate UNLESS it is a
// wrapped, staked or bridged product of a token that already trades. Those
// are marked WRAPPED, not pre-token: a wrapper cannot launch. They rank last
// by design, at 1% of the peer value — the haircut is a stated assumption,
// shown in the breakdown, not a hidden one. A protocol that already trades
// keeps its market cap as its value, so the board separates "token live"
// rows from "pre-token" rows instead of pretending a traded token is still
// a launch. Every row states its status.

export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

export type RowStatus = 'pre-token' | 'token-live' | 'wrapped';

export interface ModelRow {
  slug: string;
  name: string;
  category: string;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  age_days: number | null;
  status: RowStatus;
  watchlist: boolean;
  rank: number;
  implied_value_usd: number;
  model: {
    peer_multiple: number;
    growth_mult: number;
    age_mult: number;
    chain_mult: number;
    base_value_usd: number;
    wrapper_haircut?: number;
    mcap_reported?: boolean;
  };
}

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

/** Whole days between an ISO date (YYYY-MM-DD) and the snapshot date. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso + 'T00:00:00Z');
  const b = Date.parse(toIso + 'T00:00:00Z');
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return NaN;
  return n % 2 === 1 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
}

/** Peer multiples per category plus the global fallback, from the snapshot. */
export function peerMultiples(
  protocols: SnapshotProtocol[],
): { byCategory: Map<string, number>; global: number } {
  const byCategory = new Map<string, number[]>();
  const all: number[] = [];
  for (const p of protocols) {
    if (p.mcap_usd && p.tvl_usd > 0) {
      const r = p.mcap_usd / p.tvl_usd;
      all.push(r);
      const cat = p.category ?? 'Uncategorised';
      const arr = byCategory.get(cat) ?? [];
      arr.push(r);
      byCategory.set(cat, arr);
    }
  }
  const global = median(all);
  const out = new Map<string, number>();
  for (const [cat, ratios] of byCategory) {
    if (ratios.length >= 3) out.set(cat, median(ratios));
  }
  return { byCategory: out, global };
}

export function growthMultiplier(change7d: number | null): number {
  if (change7d === null || !Number.isFinite(change7d)) return 1;
  return 1 + clamp(change7d, -50, 150) / 300;
}

export function ageMultiplier(ageDays: number | null): number {
  if (ageDays === null) return 1;
  return 1 + (0.35 * Math.min(Math.max(ageDays, 0), 1095)) / 1095;
}

export function chainMultiplier(chainCount: number): number {
  return 1 + 0.03 * Math.min(Math.max(chainCount - 1, 0), 6);
}

// The house's watchlist rule: these are wrapped, staked or bridged products
// of a token that already trades, not launches.
const WRAPPED_CATEGORIES = new Set([
  'Bridge',
  'Canonical Bridge',
  'Liquid Staking',
  'Liquid Restaking',
  'Restaked BTC',
  'CEX',
]);
const EXCHANGE_NAMES = [
  'Binance',
  'Coinbase',
  'Bybit',
  'Kraken',
  'Bitget',
  'OKX',
  'Bitfinex',
  'Gemini',
];
const VERSION_MARKER = /\s(V\d+|v\d+|\d+\.\d+)\s*$/;
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;

/** True when a token-less protocol is a wrapped/staked/bridged product. */
export function isWrappedProduct(p: SnapshotProtocol): boolean {
  if (p.category !== null && WRAPPED_CATEGORIES.has(p.category)) return true;
  if (VERSION_MARKER.test(p.name)) return true;
  if (WRAPPED_WORD.test(p.name)) return true;
  return EXCHANGE_NAMES.some((e) => p.name.startsWith(e));
}

/** Score every protocol in the snapshot and rank them by implied value. */
export function rankProtocols(snapshot: Snapshot): ModelRow[] {
  const { byCategory, global } = peerMultiples(snapshot.protocols);
  const watch = new Set(snapshot.watchlist);
  const rows: ModelRow[] = snapshot.protocols.map((p) => {
    const live = p.gecko_id !== null || p.symbol !== null;
    const cat = p.category ?? 'Uncategorised';
    const ageDays =
      p.listed_at === null ? null : daysBetween(p.listed_at, snapshot.as_of);
    const peer = byCategory.get(cat) ?? global;
    const change7d =
      p.change_7d === null ? null : Math.round(p.change_7d * 10) / 10;
    const growth = growthMultiplier(change7d);
    const age = ageMultiplier(ageDays);
    const chain = chainMultiplier(p.chains.length);
    // TVL is rounded to the nearest $1,000: the board displays values to
    // three significant figures, and the page carries TVL in thousands.
    const tvl = Math.round(p.tvl_usd / 1000) * 1000;
    const base = tvl * peer;
    const wrapped = !live && isWrappedProduct(p);
    const status: RowStatus = live
      ? 'token-live'
      : wrapped
        ? 'wrapped'
        : 'pre-token';
    const mcap =
      live && p.mcap_usd !== null && p.mcap_usd > 0 ? p.mcap_usd : null;
    const modeled = Math.round(base * growth * age * chain);
    const implied = live
      ? (mcap ?? modeled)
      : wrapped
        ? Math.round(base * 0.01)
        : modeled;
    return {
      slug: p.slug,
      name: p.name,
      category: cat,
      chains: p.chains,
      tvl_usd: tvl,
      change_7d: change7d,
      age_days: ageDays,
      status,
      watchlist: watch.has(p.slug),
      rank: 0,
      implied_value_usd: implied,
      model: {
        peer_multiple: peer,
        growth_mult: live && mcap !== null ? 1 : growth,
        age_mult: live && mcap !== null ? 1 : age,
        chain_mult: live && mcap !== null ? 1 : chain,
        base_value_usd: Math.round(base),
        ...(live ? { mcap_reported: mcap !== null } : {}),
        ...(wrapped ? { wrapper_haircut: 0.01 } : {}),
      },
    };
  });
  rows.sort(
    (a, b) =>
      b.implied_value_usd - a.implied_value_usd ||
      b.tvl_usd - a.tvl_usd ||
      (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
  );
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}
