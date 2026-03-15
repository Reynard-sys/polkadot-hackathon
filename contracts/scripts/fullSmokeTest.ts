import { ethers } from "hardhat";
import cardsJson from "../../src/data/cards.json";

/**
 * fullSmokeTest.ts
 * One-shot script: Deploy → Seed → Open all 3 pack types.
 * No environment variables needed — addresses are passed in-memory.
 *
 * Usage:
 *   npx hardhat run scripts/fullSmokeTest.ts --network westend_assethub
 *
 * NOTE: GAS_OVERRIDES are required for Westend AssetHub's Frontier EVM node.
 * eth_estimateGas returns "Metadata error" on this node, so we bypass it by
 * supplying explicit gasPrice + gasLimit on all contract calls.
 */

const RARITY_MAP: Record<string, number> = {
  Common: 0, Rare: 1, Legendary: 2, Mythic: 3,
};
const ANIME_MAP: Record<string, number> = {
  Naruto: 0, OnePiece: 1, Pokemon: 2,
};

// Explicit gas overrides — bypass eth_estimateGas on Frontier
const GAS_OVERRIDES = {
  gasPrice: 10_000_000_000n, // 1 gwei
  gasLimit: 10_000_000_000n,
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const baseUri = process.env.BASE_URI ?? "https://ipfs.io/ipfs/bafybeiccbcahhjafae4vqgylzb57u64ac4ukjgmt2kpwugfi7rdwzrduvu/";

  console.log("===========================================");
  console.log("  Anime Gacha TCG — Full Smoke Test");
  console.log("===========================================");
  console.log("Deployer: ", deployer.address);
  console.log("Network:  ", (await ethers.provider.getNetwork()).name);
  console.log("Balance:  ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log("");

  // ─── 1. Deploy CardRegistry ───────────────────────────────────────────────
  console.log("1. Deploying CardRegistry...");
  const CardRegistryFactory = await ethers.getContractFactory("CardRegistry");
  const registry = await CardRegistryFactory.deploy(GAS_OVERRIDES);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   ✅ CardRegistry:", registryAddr);

  // ─── 2. Deploy GachaNFT ───────────────────────────────────────────────────
  console.log("2. Deploying GachaNFT...");
  const caps: bigint[] = new Array(48).fill(0n);
  for (const card of cardsJson) {
    caps[parseInt(card.nftTokenId, 10) - 1] = BigInt(card.maxSupply);
  }
  const GachaNFTFactory = await ethers.getContractFactory("GachaNFT");
  const gachaNFT = await GachaNFTFactory.deploy(
    baseUri,
    caps as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    GAS_OVERRIDES,
  );
  await gachaNFT.waitForDeployment();
  const nftAddr = await gachaNFT.getAddress();
  console.log("   ✅ GachaNFT:    ", nftAddr);

  // ─── 3. Deploy GachaPack ─────────────────────────────────────────────────
  console.log("3. Deploying GachaPack...");
  const GachaPackFactory = await ethers.getContractFactory("GachaPack");
  const gachaPack = await GachaPackFactory.deploy(nftAddr, registryAddr, GAS_OVERRIDES);
  await gachaPack.waitForDeployment();
  const packAddr = await gachaPack.getAddress();
  console.log("   ✅ GachaPack:   ", packAddr);

  // ─── 4. Authorise GachaPack as minter ────────────────────────────────────
  console.log("4. Authorising GachaPack as minter...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (await (gachaNFT as any).setMinter(packAddr, true, GAS_OVERRIDES)).wait();
  console.log("   ✅ Minter set");

  // ─── 5. Seed cards ────────────────────────────────────────────────────────
  console.log("5. Seeding 48 cards into CardRegistry...");
  const tokenIds: bigint[] = [];
  const rarities: number[] = [];
  const animes: number[]   = [];
  const maxSupplies: bigint[] = [];
  for (const card of cardsJson) {
    tokenIds.push(BigInt(parseInt(card.nftTokenId, 10)));
    rarities.push(RARITY_MAP[card.rarity]);
    animes.push(ANIME_MAP[card.anime]);
    maxSupplies.push(BigInt(card.maxSupply));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (await (registry as any).registerCards(tokenIds, rarities, animes, maxSupplies, GAS_OVERRIDES)).wait();
  console.log("   ✅ All 48 cards registered");
  for (const [name, id] of [["Common",0],["Rare",1],["Legendary",2],["Mythic",3]]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (registry as any).getCardsByRarity(id);
    console.log(`      ${name} pool: ${pool.length} cards`);
  }

  // ─── 6. Open packs ───────────────────────────────────────────────────────
  console.log("\n6. Opening packs as deployer...");
  const iface = new ethers.Interface([
    "event PackOpened(address indexed player, uint8 packType, uint256[] tokenIds)",
  ]);

  for (const [packName, method, price] of [
    ["Standard (x10)", "openStandardPack", "0.001" ],
    ["Premium  (x20)", "openPremiumPack",  "0.0018"],
    ["Ultra    (x30)", "openUltraPack",    "0.0025"],
  ] as const) {
    process.stdout.write(`   Opening ${packName}... `);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (gachaPack as any)[method]({
      value: ethers.parseEther(price),
      ...GAS_OVERRIDES,
    });
    const receipt = await tx.wait();
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "PackOpened") {
          const ids: bigint[] = parsed.args.tokenIds;
          const unique = new Set(ids.map(String)).size;
          console.log(`✅ ${ids.length} cards, ${unique} unique — [${ids.join(",")}]`);
        }
      } catch { /* skip */ }
    }
  }

  console.log("\n===========================================");
  console.log("  Smoke Test PASSED ✅");
  console.log("===========================================");
  console.log(`  CARD_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`  NEXT_PUBLIC_GACHA_NFT_ADDRESS=${nftAddr}`);
  console.log(`  NEXT_PUBLIC_GACHA_PACK_ADDRESS=${packAddr}`);
  console.log("\n👉 Add the NEXT_PUBLIC_* values to gacha/.env.local then run: npm run dev");
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
