// farmPlans.ts — concrete farm plans.
//
// Every board row carries 3-12 steps. A step is a thing to do, what it costs
// and how long it takes — never a slogan. Steps are built from the protocol's
// own category and chains, so two protocols in the same family still get
// different plans: their name and chains are in the text.
//
// Placeholders: {n} = protocol name, {c} = first chain, {c2} = second chain
// (or the first chain again when the protocol runs on one chain only).
//
// Protocols whose token already trades get the LIVE set instead: there is no
// launch left to farm, so the steps say so plainly and cover what to do with
// the traded token. Wrapped, staked or bridged products get the WRAPPED set:
// they cannot launch either, so the steps say what they are for instead.

export type FarmFamily =
  | 'dex'
  | 'lend'
  | 'stake'
  | 'bridge'
  | 'deriv'
  | 'yield'
  | 'rwa'
  | 'generic';

const FAMILIES: Record<FarmFamily, string[]> = {
  dex: [
    'Open {n} on {c} from its official site; connect a fresh wallet (10 min, $0).',
    'Bridge $50–200 to {c} via the official bridge or a vetted router ($2–10 gas, 10–20 min).',
    'Swap $25–100 through {n} in 2–3 separate weeks for repeat volume ($0.50–3 a swap).',
    'Add $50–200 liquidity to one pool; leave it 4+ weeks ($1–5 gas, then passive).',
    "Check {n}'s announcements weekly; ignore airdrop links in DMs (5 min a week, $0).",
  ],
  lend: [
    'Open {n} on {c} from its official site; read the market list first (15 min, $0).',
    'Bridge $100–300 in a stablecoin to {c} ($2–10 gas, 10–20 min).',
    'Supply $50–200 to {n}; keep it open 4+ weeks ($1–5 gas).',
    'Borrow $20–50 against it; repay within a week for a full cycle ($2–6 gas + interest).',
    "Watch {n}'s rewards page weekly; never sign 'claim' txs from DM links (5 min, $0).",
  ],
  stake: [
    'Open {n} on {c} from its official site; compare its rate to the native rate (10 min, $0).',
    'Bridge $50–200 to {c} via the official bridge or a vetted router ($2–10 gas, 10–20 min).',
    'Stake $50–200 through {n}; hold 4+ weeks — staked balance is the activity ($1–5 gas).',
    'Restake or compound rewards weekly for a month ($0.50–2 per tx).',
    "Follow {n}'s announcements; ignore claim links from strangers (5 min a week, $0).",
  ],
  bridge: [
    'Open {n} on {c} from its official site; check its routes first (10 min, $0).',
    'Bridge $50–200 to {c} through {n} itself — the transfer IS the farm ($3–12, 10–30 min).',
    'Make 2–3 more {n} transfers of $25–100 in different weeks ($3–12 each, 10–30 min).',
    'Keep $20–50 routed through {n} for a month for sustained activity ($0 to hold).',
    "Track {n}'s channels; never use a bridge link from a DM or ad (5 min a week, $0).",
  ],
  deriv: [
    'Open {n} on {c} from its official site; read its margin and fee schedule (15 min, $0).',
    'Bridge $100–300 collateral to {c} ($2–10 gas, 10–20 min).',
    'Open a $25–100 position at low leverage; close within days ($1–5 fees, under an hour).',
    'Repeat 2–3 small trades over a month; keep collateral posted ($1–5 per trade).',
    "Watch {n}'s announcements; never sign claim txs from DM links (5 min a week, $0).",
  ],
  yield: [
    'Open {n} on {c} from its official site; read what its vaults hold first (15 min, $0).',
    'Bridge $100–300 to {c} via the official bridge or a vetted router ($2–10 gas, 10–20 min).',
    'Deposit $50–200 into one {n} vault; leave it 4+ weeks ($1–5 gas).',
    'Claim or compound vault rewards weekly for a month ($0.50–2 per claim).',
    "Follow {n}'s channels; ignore airdrop claim links from strangers (5 min a week, $0).",
  ],
  rwa: [
    'Open {n} on {c} from its official site; read its backing and eligibility rules (15 min, $0).',
    'Bridge $100–300 in a stablecoin to {c} ($2–10 gas, 10–20 min).',
    "Mint or buy $50–200 of {n}'s asset; hold 4+ weeks ($2–8 in fees).",
    'Use the asset once more — redeem, re-mint or move chains ($2–8, under an hour).',
    "Watch {n}'s announcements; never trust claim links from DMs or ads (5 min a week, $0).",
  ],
  generic: [
    'Open {n} on {c} from its official site; read its docs before moving funds (15 min, $0).',
    'Bridge $50–200 to {c} via the official bridge or a vetted router ($2–10 gas, 10–20 min).',
    'Use {n} with $25–100 in 2–3 separate weeks ($1–5 per use).',
    'Keep a $50–200 position open 4+ weeks, then use it once more ($1–5 gas).',
    "Check {n}'s channels weekly; ignore claim links from DMs (5 min a week, $0).",
  ],
};

const LIVE_STEPS = [
  "{n} already has a token trading — no launch left to farm; any 'claim' link is a scam (10 min, $0).",
  'To get exposure, buy only on a vetted exchange or DEX on {c} ($1–5 in fees).',
  'Stake or hold the token 4+ weeks if {n} pays rewards; check unlocks first (minutes).',
  "Compare {n}'s market cap with its TVL here before buying — context, not a farm (10 min, $0).",
  "Follow {n}'s announcements; a traded token can still earn fees or rights (5 min a week, $0).",
];

const WRAPPED_STEPS = [
  '{n} is a wrapped, staked or bridged form of a traded token — it cannot launch one (10 min, $0).',
  'Use {n} only for what it is: move value between {c} and other chains, or hold it ($1–5 fees).',
  'Bridging with {n}? Move $50–200; check peg and fees first — a depeg costs more than gas ($2–10, 10–30 min).',
  "Any 'airdrop' for {n} is a scam: wrappers do not drop tokens; verify on its official site (5 min, $0).",
  'For launch upside, farm the underlying protocol instead — this board ranks it separately (10 min, $0).',
];

const FAMILY_BY_CATEGORY: Record<string, FarmFamily> = {
  Dexs: 'dex',
  Lending: 'lend',
  'Uncollateralized Lending': 'lend',
  'Collateral Markets': 'lend',
  'Collateral Management': 'lend',
  'Liquid Staking': 'stake',
  'Liquid Restaking': 'stake',
  Restaking: 'stake',
  'Restaked BTC': 'stake',
  'Staking Pool': 'stake',
  Bridge: 'bridge',
  'Canonical Bridge': 'bridge',
  'Cross Chain Bridge': 'bridge',
  Derivatives: 'deriv',
  Options: 'deriv',
  'Options Vault': 'deriv',
  'Interest Rate Derivatives': 'deriv',
  Synthetics: 'deriv',
  'Basis Trading': 'deriv',
  'Prediction Market': 'deriv',
  Yield: 'yield',
  'Yield Aggregator': 'yield',
  Farm: 'yield',
  'Leveraged Farming': 'yield',
  'Onchain Capital Allocator': 'yield',
  'Risk Curators': 'yield',
  'Liquidity Manager': 'yield',
  RWA: 'rwa',
  'Reserve Currency': 'rwa',
  'Anchor BTC': 'rwa',
  'Decentralized BTC': 'rwa',
  'Stablecoin Issuer': 'rwa',
  'Algo-Stables': 'rwa',
  'Dual-Token Stablecoin': 'rwa',
  'Stablecoin Wrapper': 'rwa',
  'Token Locker': 'rwa',
  CDP: 'rwa',
  'CDP Manager': 'rwa',
  CeDeFi: 'rwa',
};

export function familyFor(category: string): FarmFamily {
  return FAMILY_BY_CATEGORY[category] ?? 'generic';
}

function fill(
  template: string,
  name: string,
  chain: string,
  chain2: string,
): string {
  return template
    .replaceAll('{n}', name)
    .replaceAll('{c2}', chain2)
    .replaceAll('{c}', chain);
}

/** Five concrete steps for one protocol. Same inputs always give same steps. */
export function farmSteps(
  name: string,
  category: string,
  chains: string[],
  status: 'pre-token' | 'token-live' | 'wrapped',
): string[] {
  const chain = chains[0] ?? 'Ethereum';
  const chain2 = chains[1] ?? chain;
  const templates =
    status === 'token-live'
      ? LIVE_STEPS
      : status === 'wrapped'
        ? WRAPPED_STEPS
        : FAMILIES[familyFor(category)];
  return templates.map((t) => fill(t, name, chain, chain2));
}
