/**
 * createEnv.ts
 * ---------------------------------------------------------------------------
 * Run this after a successful deploy.ts to write env files for both the
 * contracts workspace and the Next.js frontend.
 *
 * Usage:
 *   In contracts/.env (or pass as shell env vars):
 *     CARD_REGISTRY_ADDRESS=0x...
 *     NEXT_PUBLIC_GACHA_NFT_ADDRESS=0x...
 *     NEXT_PUBLIC_GACHA_PACK_ADDRESS=0x...
 *
 *   Then run:
 *     npx hardhat run scripts/createEnv.ts --network westend_assethub
 * ---------------------------------------------------------------------------
 */

import * as fs   from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load existing contracts/.env if present
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const registryAddr  = process.env.CARD_REGISTRY_ADDRESS;
  const nftAddr       = process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS;
  const packAddr      = process.env.NEXT_PUBLIC_GACHA_PACK_ADDRESS;

  const missing: string[] = [];
  if (!registryAddr)  missing.push("CARD_REGISTRY_ADDRESS");
  if (!nftAddr)       missing.push("NEXT_PUBLIC_GACHA_NFT_ADDRESS");
  if (!packAddr)      missing.push("NEXT_PUBLIC_GACHA_PACK_ADDRESS");
  if (missing.length) {
    throw new Error(
      `Missing required variables in contracts/.env:\n  ${missing.join("\n  ")}\n` +
      `Set them from the output of deploy.ts and re-run this script.`
    );
  }

  // ── 1. Write contracts/.env ─────────────────────────────────────────────
  const contractsEnvPath = path.resolve(__dirname, "../.env");
  const contractsEnv =
    `PRIVATE_KEY=${process.env.PRIVATE_KEY ?? "<your-private-key-here>"}\n` +
    `CARD_REGISTRY_ADDRESS=${registryAddr}\n` +
    `NEXT_PUBLIC_GACHA_NFT_ADDRESS=${nftAddr}\n` +
    `NEXT_PUBLIC_GACHA_PACK_ADDRESS=${packAddr}\n`;

  fs.writeFileSync(contractsEnvPath, contractsEnv, "utf8");
  console.log("✅ Wrote contracts/.env");

  // ── 2. Write root .env.local (Next.js frontend) ─────────────────────────
  const frontendEnvPath = path.resolve(__dirname, "../../../.env.local");
  const frontendEnv =
    `NEXT_PUBLIC_GACHA_NFT_ADDRESS=${nftAddr}\n` +
    `NEXT_PUBLIC_GACHA_PACK_ADDRESS=${packAddr}\n`;

  fs.writeFileSync(frontendEnvPath, frontendEnv, "utf8");
  console.log("✅ Wrote .env.local (frontend root)");

  // ── 3. Print summary ─────────────────────────────────────────────────────
  console.log("\n📋 Summary");
  console.log("══════════════════════════════════");
  console.log(`  CardRegistry : ${registryAddr}`);
  console.log(`  GachaNFT     : ${nftAddr}`);
  console.log(`  GachaPack    : ${packAddr}`);
  console.log("\n👉 Next step: seed the CardRegistry:");
  console.log("   npx hardhat run scripts/seedCards.ts --network westend_assethub");
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
