/**
 * gacha-engine.ts
 * Client-side gacha simulation that mirrors GachaPack.sol's exact logic.
 *
 * Rarity weights (out of 10 000):
 *   0–8199    → Common    (82.00%)
 *   8200–9599 → Rare      (14.00%)
 *   9600–9979 → Legendary  (3.80%)
 *   9980–9999 → Mythic     (0.20%)
 *
 * Pack configs:
 *   Standard  x10 → ≥1 Rare guaranteed
 *   Premium   x20 → ≥2 Rare guaranteed
 *   Ultra     x30 → ≥3 Rare + ≥1 Legendary guaranteed
 *
 * Card pools (from cards.json):
 *   naruto   → token IDs 1–16
 *   onepiece → token IDs 17–32
 *
 * Pool size is 16 per series. Packs of 20 and 30 exceed the unique pool,
 * so duplicate picks are allowed after the pool is exhausted (weighted by
 * rarity so higher-rarity dupes are rarer than common dupes).
 *
 * Pity: after 50 packs without Mythic, each additional pack adds 20 bp
 * to the Mythic range. Stored in localStorage.
 */

import cardsData from "@/data/cards.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PackSeries = "naruto" | "onepiece";
export type PackType   = "standard" | "premium" | "ultra";
export type Rarity     = "Common" | "Rare" | "Legendary" | "Mythic";

export interface SimCard {
  tokenId: number;
  name: string;
  subtitle: string;
  rarity: Rarity;
  anime: string;
  imageUrl: string;
}

export interface SimPackResult {
  cards: SimCard[];
  packType: PackType;
  series: PackSeries;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_COMMON    = 8200;
const WEIGHT_RARE      = 9600;
const WEIGHT_LEGENDARY = 9980;
// Mythic: 9980–9999

const PITY_THRESHOLD = 50;
const PITY_STEP      = 20; // basis points per pack above threshold

const PITY_KEY = "gacha_pity_counter";

// Pack config: [size, minRare, minLegendary, maxCopies]
// maxCopies = max times a single card can appear within ONE pack open:
//   x10 → 1 (no duplicates), x20 → 2 (max 1 dupe), x30 → 3 (max 2 dupes)
const PACK_CONFIG: Record<PackType, { size: number; minRare: number; minLegendary: boolean; maxCopies: number }> = {
  standard: { size: 10, minRare: 1, minLegendary: false, maxCopies: 1 },
  premium:  { size: 20, minRare: 2, minLegendary: false, maxCopies: 2 },
  ultra:    { size: 30, minRare: 3, minLegendary: true,  maxCopies: 3 },
};

// ── Card pool (derived from cards.json) ──────────────────────────────────────

interface RawCard {
  nftTokenId: string;
  name: string;
  subtitle: string;
  rarity: string;
  anime: string;
  imageUrl: string;
}

const ALL_CARDS = cardsData as RawCard[];

const NARUTO_IDS   = { min: 1,  max: 16 };
const ONEPIECE_IDS = { min: 17, max: 32 };

function getPool(series: PackSeries): SimCard[] {
  const range = series === "naruto" ? NARUTO_IDS : ONEPIECE_IDS;
  return ALL_CARDS
    .filter(c => {
      const id = parseInt(c.nftTokenId, 10);
      return id >= range.min && id <= range.max;
    })
    .map(c => ({
      tokenId:  parseInt(c.nftTokenId, 10),
      name:     c.name,
      subtitle: c.subtitle,
      rarity:   c.rarity as Rarity,
      anime:    c.anime,
      imageUrl: c.imageUrl,
    }));
}

function getPoolByRarity(pool: SimCard[], rarity: Rarity): SimCard[] {
  return pool.filter(c => c.rarity === rarity);
}

// ── Pity tracker (localStorage) ───────────────────────────────────────────────

function getPityCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(PITY_KEY) ?? "0", 10) || 0;
}

function setPityCount(n: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PITY_KEY, String(n));
}

function getPityBonus(count: number): number {
  if (count <= PITY_THRESHOLD) return 0;
  return (count - PITY_THRESHOLD) * PITY_STEP;
}

// ── Pseudo-random helpers ────────────────────────────────────────────────────

// Seeded PRNG (xorshift32) driven by a wallet signature hex string + time.
// Falls back to crypto.getRandomValues when no seed is provided.
let _seedState = 0;

function initSeed(hex: string, timeNonce: number) {
  // XOR all 4-byte chunks of the signature into a 32-bit seed, then mix in time
  const clean = hex.replace(/^0x/, "");
  let s = 0x9e3779b9;
  for (let i = 0; i < clean.length - 7; i += 8) {
    s ^= parseInt(clean.slice(i, i + 8), 16) >>> 0;
  }
  // Mix in the time nonce so same wallet gets different pulls each session
  s ^= (timeNonce & 0xffffffff) >>> 0;
  _seedState = s >>> 0 || 1;
}

function seededRandInt(max: number): number {
  // xorshift32
  let x = _seedState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  _seedState = x >>> 0;
  return Math.abs(x) % max;
}

function secureRandInt(max: number): number {
  if (_seedState !== 0) return seededRandInt(max);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

// ── Rarity roller ─────────────────────────────────────────────────────────────

function rollRarity(pityBonus: number): Rarity {
  const roll = secureRandInt(10000);
  // Effective Mythic threshold: baseline 9980, lowered by pity bonus (floor at Legendary boundary)
  const effectiveMythic = pityBonus >= (10000 - WEIGHT_LEGENDARY)
    ? WEIGHT_LEGENDARY
    : WEIGHT_LEGENDARY + (10000 - WEIGHT_LEGENDARY) - pityBonus;

  if (roll < WEIGHT_COMMON)   return "Common";
  if (roll < WEIGHT_RARE)     return "Rare";
  if (roll < effectiveMythic) return "Legendary";
  return "Mythic";
}

// Guaranteed slot: rolls for at least minRarity (can upgrade higher)
function rollGuaranteedRarity(minRarity: Rarity): Rarity {
  const roll = secureRandInt(10000);
  if (minRarity === "Rare") {
    if (roll >= WEIGHT_LEGENDARY) return "Mythic";
    if (roll >= WEIGHT_RARE)      return "Legendary";
    return "Rare";
  }
  if (minRarity === "Legendary") {
    if (roll >= WEIGHT_LEGENDARY) return "Mythic";
    return "Legendary";
  }
  return minRarity;
}

// ── Card picker ───────────────────────────────────────────────────────────────
//
// Strategy:
//   1. Try to pick a card of the requested rarity that is still under its copy cap.
//   2. If all cards of that rarity have hit the cap, fall back through lower rarities
//      looking for any card still under the cap.
//   3. If every card in the pool is at the cap (extremely unlikely) return null.
//
// maxCopies controls per-pack duplicate limits:
//   x10 → 1 (no duplicates allowed), x20 → 2 (max 1 dupe), x30 → 3 (max 2 dupes)
//
function pickCard(
  pool: SimCard[],
  rarity: Rarity,
  usedCounts: Map<number, number>,
  maxCopies: number,
): SimCard | null {
  // Cards of the requested rarity that haven't hit their copy cap yet
  const candidates = getPoolByRarity(pool, rarity).filter(
    c => (usedCounts.get(c.tokenId) ?? 0) < maxCopies
  );
  if (candidates.length > 0) {
    const pick = candidates[secureRandInt(candidates.length)];
    usedCounts.set(pick.tokenId, (usedCounts.get(pick.tokenId) ?? 0) + 1);
    return pick;
  }

  // All cards of this rarity are at cap — fall back through lower rarities
  const fallbackOrder: Rarity[] = ["Legendary", "Rare", "Common"];
  for (const r of fallbackOrder) {
    if (r === rarity) continue;
    const fb = getPoolByRarity(pool, r).filter(
      c => (usedCounts.get(c.tokenId) ?? 0) < maxCopies
    );
    if (fb.length > 0) {
      const pick = fb[secureRandInt(fb.length)];
      usedCounts.set(pick.tokenId, (usedCounts.get(pick.tokenId) ?? 0) + 1);
      return pick;
    }
  }
  return null;
}

// ── Main simulate function ────────────────────────────────────────────────────

/**
 * Simulate opening a gacha pack fully client-side.
 *
 * @param walletSignature  Optional MetaMask personal_sign hex — seeds the PRNG.
 *                         The message already includes Date.now() nonce so the
 *                         same wallet gets different pulls each time.
 */
export function simulatePack(
  packType: PackType,
  series: PackSeries,
  walletSignature?: string,
): SimPackResult {
  // Reset seed
  _seedState = 0;

  if (walletSignature) {
    // Use current time as an extra nonce even with the same signature,
    // so re-rolling the same wallet gives different results.
    initSeed(walletSignature, Date.now());
  } else {
    // No wallet: use crypto random — _seedState stays 0, secureRandInt uses crypto
    _seedState = 0;
  }

  const cfg  = PACK_CONFIG[packType];
  const pool = getPool(series);
  // `usedCounts` tracks how many times each tokenId has been picked in this pack.
  // Combined with cfg.maxCopies this enforces the per-pack duplicate caps.
  const usedCounts = new Map<number, number>();
  const cards: SimCard[] = [];

  const pityCount = getPityCount();
  const pityBonus = getPityBonus(pityCount);

  let gotMythic = false;

  // ── Guaranteed Rare slots ─────────────────────────────────────────────────
  for (let g = 0; g < cfg.minRare; g++) {
    const rarity = rollGuaranteedRarity("Rare");
    const card = pickCard(pool, rarity, usedCounts, cfg.maxCopies);
    if (card) {
      cards.push(card);
      if (card.rarity === "Mythic") gotMythic = true;
    }
  }

  // ── Guaranteed Legendary slot (Ultra pack) ────────────────────────────────
  if (cfg.minLegendary) {
    const rarity = rollGuaranteedRarity("Legendary");
    const card = pickCard(pool, rarity, usedCounts, cfg.maxCopies);
    if (card) {
      cards.push(card);
      if (card.rarity === "Mythic") gotMythic = true;
    }
  }

  // ── Normal random slots ───────────────────────────────────────────────────
  // Safety cap: prevent any theoretical infinite loop
  let attempts = 0;
  while (cards.length < cfg.size && attempts < cfg.size * 3) {
    attempts++;
    const rarity = rollRarity(pityBonus);
    const card = pickCard(pool, rarity, usedCounts, cfg.maxCopies);
    if (card) {
      cards.push(card);
      if (card.rarity === "Mythic") gotMythic = true;
    }
  }

  // ── Update pity counter ───────────────────────────────────────────────────
  setPityCount(gotMythic ? 0 : pityCount + 1);

  return { cards, packType, series };
}
