/**
 * redeployPack.ts
 * ---------------------------------------------------------------------------
 * Redeploys ONLY the GachaPack contract (CardRegistry and GachaNFT stay).
 * This is needed when GachaPack.sol function signatures change.
 *
 * Usage:
 *   npx hardhat run scripts/redeployPack.ts --network westend_assethub
 *
 * After running:
 *   1. Update NEXT_PUBLIC_GACHA_PACK_ADDRESS in .env.local
 *   2. Restart the Next.js dev server
 * ---------------------------------------------------------------------------
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path  from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GAS = {
  gasPrice: 10_000_000_000n,
  gasLimit: 10_000_000_000n,
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const nftAddr      = process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS;
  const registryAddr = process.env.CARD_REGISTRY_ADDRESS;
  if (!nftAddr)      throw new Error("Set NEXT_PUBLIC_GACHA_NFT_ADDRESS in contracts/.env");
  if (!registryAddr) throw new Error("Set CARD_REGISTRY_ADDRESS in contracts/.env");

  const [deployer] = await ethers.getSigners();
  const network    = await ethers.provider.getNetwork();
  const isLocal    = network.chainId === 31337n;
  const CONFIRMS   = isLocal ? 1 : 2;
  const PAUSE      = isLocal ? 0 : 5000;

  console.log("==========================================");
  console.log("  Redeploying GachaPack");
  console.log("==========================================");
  console.log("  Deployer :", deployer.address);
  console.log("  Network  :", network.name, `(chainId ${network.chainId})`);
  console.log("  GachaNFT :", nftAddr);
  console.log("  Registry :", registryAddr);
  console.log("");

  // ── 1. Deploy new GachaPack ─────────────────────────────────────────────
  console.log("1. Deploying GachaPack...");
  const GachaPackFactory = await ethers.getContractFactory("GachaPack");
  const gachaPack = await GachaPackFactory.deploy(nftAddr, registryAddr, GAS);
  await gachaPack.deploymentTransaction()?.wait(CONFIRMS);
  const packAddr = await gachaPack.getAddress();
  console.log("   ✅ GachaPack:", packAddr);
  if (PAUSE) { console.log(`   ⏳ Waiting ${PAUSE / 1000}s...`); await sleep(PAUSE); }

  // ── 2. Authorise new GachaPack as minter ────────────────────────────────
  console.log("2. Authorising new GachaPack as minter on GachaNFT...");
  const gachaNFT = await ethers.getContractAt("GachaNFT", nftAddr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (gachaNFT as any).setMinter(packAddr, true, GAS);
  await tx.wait(CONFIRMS);
  console.log("   ✅ Minter authorised");

  // ── 3. Summary ───────────────────────────────────────────────────────────
  console.log("\n==========================================");
  console.log("  ✅ Redeploy Complete");
  console.log("==========================================");
  console.log(`  NEXT_PUBLIC_GACHA_PACK_ADDRESS=${packAddr}`);
  console.log("\n👉 Next steps:");
  console.log("  1. Update NEXT_PUBLIC_GACHA_PACK_ADDRESS in .env.local");
  console.log("  2. Restart Next.js: npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
