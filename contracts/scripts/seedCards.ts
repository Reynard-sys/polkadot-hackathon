import { ethers } from "hardhat";
import { CardRegistry } from "../typechain-types";
import cardsJson from "../../src/data/cards.json";

/**
 * seedCards.ts
 * Reads all 48 cards from cards.json and registers them on-chain
 * in the CardRegistry contract.
 *
 * Usage:
 *   npx hardhat run scripts/seedCards.ts --network <network>
 */

// Map JSON rarity strings to CardRegistry enum values
const RARITY_MAP: Record<string, number> = {
  Common:    0,
  Rare:      1,
  Legendary: 2,
  Mythic:    3,
};

// Map JSON anime strings to CardRegistry enum values
const ANIME_MAP: Record<string, number> = {
  Naruto:   0,
  OnePiece: 1,
  Pokemon:  2,
};

async function main() {
  const registryAddress = process.env.CARD_REGISTRY_ADDRESS;
  if (!registryAddress) {
    throw new Error("Set CARD_REGISTRY_ADDRESS in your environment");
  }

  const registry = await ethers.getContractAt("CardRegistry", registryAddress) as unknown as CardRegistry;
  const [signer] = await ethers.getSigners();

  console.log("Seeding cards with account:", signer.address);
  console.log("CardRegistry:", registryAddress);
  console.log("Total cards to register:", cardsJson.length);

  // Build arrays
  const tokenIds:   bigint[] = [];
  const rarities:   number[] = [];
  const animes:     number[] = [];
  const maxSupplies: bigint[] = [];

  for (const card of cardsJson) {
    const tokenId = parseInt(card.nftTokenId, 10);
    const rarity  = RARITY_MAP[card.rarity];
    const anime   = ANIME_MAP[card.anime];
    const supply  = card.maxSupply;

    if (rarity === undefined) throw new Error(`Unknown rarity: ${card.rarity} for ${card.id}`);
    if (anime  === undefined) throw new Error(`Unknown anime: ${card.anime} for ${card.id}`);

    tokenIds.push(BigInt(tokenId));
    rarities.push(rarity);
    animes.push(anime);
    maxSupplies.push(BigInt(supply));
  }

  // Register all cards in one transaction
  console.log("\nRegistering all cards in a single tx...");
  const tx = await (registry as any).registerCards(tokenIds, rarities, animes, maxSupplies);
  console.log("Tx submitted:", tx.hash);
  await tx.wait();
  console.log("✅ All 48 cards registered successfully!\n");

  // Verify a few
  for (const rarity of ["Common", "Rare", "Legendary", "Mythic"] as const) {
    const pool = await (registry as any).getCardsByRarity(RARITY_MAP[rarity]);
    console.log(`  ${rarity} pool size: ${pool.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
