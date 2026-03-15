/**
 * setPrices.ts
 * ---------------------------------------------------------------------------
 * Updates the pack prices on the already-deployed GachaPack contract.
 * Reads NEXT_PUBLIC_GACHA_PACK_ADDRESS from contracts/.env
 *
 * Usage:
 *   npx hardhat run scripts/setPrices.ts --network westend_assethub
 * ---------------------------------------------------------------------------
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/** Westend Frontier EVM — explicit gas required */
const GAS = {
  gasPrice: 10_000_000_000n,
  gasLimit: 10_000_000_000n,
};

// Pack type enum values match GachaPack.sol: Standard=0, Premium=1, Ultra=2
const PACK_PRICES = [
  { type: 0, name: "Standard x10", price: ethers.parseEther("0.001")  },
  { type: 1, name: "Premium  x20", price: ethers.parseEther("0.0018") },
  { type: 2, name: "Ultra    x30", price: ethers.parseEther("0.0025") },
];

async function main() {
  const packAddr = process.env.NEXT_PUBLIC_GACHA_PACK_ADDRESS;
  if (!packAddr) throw new Error("Set NEXT_PUBLIC_GACHA_PACK_ADDRESS in contracts/.env");

  const network  = await ethers.provider.getNetwork();
  const isLocal  = network.chainId === 31337n;
  const CONFIRMS = isLocal ? 1 : 2;
  const PAUSE    = isLocal ? 0 : 5000;
  const sleep    = (ms: number) => new Promise(r => setTimeout(r, ms));

  const [signer] = await ethers.getSigners();
  console.log("Updating pack prices");
  console.log("  Account  :", signer.address);
  console.log("  GachaPack:", packAddr);
  console.log("  Network  :", network.name, `(chainId ${network.chainId})`);
  console.log("");

  const pack = await ethers.getContractAt("GachaPack", packAddr);

  for (const cfg of PACK_PRICES) {
    console.log(`Setting ${cfg.name} → ${ethers.formatEther(cfg.price)} WND...`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (pack as any).setPackPrice(cfg.type, cfg.price, GAS);
    console.log(`  Tx: ${tx.hash}`);
    await tx.wait(CONFIRMS);
    console.log(`  ✅ Confirmed`);
    if (PAUSE) { await sleep(PAUSE); }
  }

  console.log("\n✅ All pack prices updated!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
