import { ethers } from "hardhat";
import { CardRegistry } from "../typechain-types";
import cardsJson from "../../src/data/cards.json";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const RARITY_MAP: Record<string, number> = {
  Common: 0, Rare: 1, Legendary: 2, Mythic: 3,
};
const ANIME_MAP: Record<string, number> = {
  Naruto: 0, OnePiece: 1, Pokemon: 2,
};

/** Westend Frontier EVM requires explicit gas — cannot estimate. */
const GAS = { gasLimit: 10_000_000_000n, gasPrice: 10_000_000_000n };

/** Cards per registerCards() call — keep ≤12 to avoid gas overflow. */
const BATCH_SIZE = 12;

async function main() {
  const registryAddress = process.env.CARD_REGISTRY_ADDRESS;
  if (!registryAddress) throw new Error("Set CARD_REGISTRY_ADDRESS in contracts/.env");

  const network  = await ethers.provider.getNetwork();
  const isLocal  = network.chainId === 31337n;
  const CONFIRMS = isLocal ? 1 : 2;
  const PAUSE    = isLocal ? 0 : 5000;

  const registry = await ethers.getContractAt(
    "CardRegistry", registryAddress
  ) as unknown as CardRegistry;
  const [signer] = await ethers.getSigners();

  console.log("Seeding cards with account:", signer.address);
  console.log("CardRegistry:              ", registryAddress);
  console.log("Total cards:               ", cardsJson.length);
  console.log("Batch size:                ", BATCH_SIZE);
  console.log("Confirmations:             ", CONFIRMS);
  console.log("");

  // Build full arrays
  const allIds:      bigint[] = [];
  const allRarities: number[] = [];
  const allAnimes:   number[] = [];
  const allSupplies: bigint[] = [];

  for (const card of cardsJson) {
    const rarity = RARITY_MAP[card.rarity];
    const anime  = ANIME_MAP[card.anime];
    if (rarity === undefined) throw new Error(`Unknown rarity: ${card.rarity}`);
    if (anime  === undefined) throw new Error(`Unknown anime:  ${card.anime}`);
    allIds.push(BigInt(card.nftTokenId));
    allRarities.push(rarity);
    allAnimes.push(anime);
    allSupplies.push(BigInt(card.maxSupply));
  }

  // Register in batches
  const totalBatches = Math.ceil(allIds.length / BATCH_SIZE);

  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const ids      = allIds.slice(i, i + BATCH_SIZE);
    const rarities = allRarities.slice(i, i + BATCH_SIZE);
    const animes   = allAnimes.slice(i, i + BATCH_SIZE);
    const supplies = allSupplies.slice(i, i + BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}: cards ${ids[0]}–${ids[ids.length - 1]}...`);

    const tx = await (registry as any).registerCards(ids, rarities, animes, supplies, GAS);
    console.log(`  Tx: ${tx.hash}`);
    await tx.wait(CONFIRMS);
    console.log(`  ✅ Batch ${batchNum} confirmed`);

    if (PAUSE && i + BATCH_SIZE < allIds.length) {
      console.log(`  ⏳ Waiting ${PAUSE / 1000}s...`);
      await sleep(PAUSE);
    }
  }

  console.log("\n✅ All cards registered!\n");

  // Verify pool sizes — view calls may fail on Frontier EVM ("Metadata error"), that's ok.
  try {
    for (const [label, value] of Object.entries(RARITY_MAP)) {
      const pool = await (registry as any).getCardsByRarity(value);
      console.log(`  ${label}: ${pool.length} cards`);
    }
  } catch {
    console.log("  (Pool size read skipped — Frontier view call limitation)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
