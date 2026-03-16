import { ethers } from "hardhat";

/**
 * openPackDemo.ts
 * Demonstrates opening one pack of each type and prints the results.
 *
 * Usage:
 *   GACHA_PACK_ADDRESS=0x... PACK_SERIES=2 npx hardhat run scripts/openPackDemo.ts --network westend_assethub
 */

const PACK_TYPES: Record<string, { method: string; price: string }> = {
  Standard: { method: "openStandardPack", price: "0.001" },
  Premium:  { method: "openPremiumPack",  price: "0.0018" },
  Ultra:    { method: "openUltraPack",    price: "0.0025" },
};
const SERIES_LABELS = ["Naruto", "OnePiece", "Pokemon"] as const;
const GAS = { gasPrice: 10_000_000_000n, gasLimit: 10_000_000_000n };

async function main() {
  const packAddress = process.env.GACHA_PACK_ADDRESS;
  if (!packAddress) throw new Error("Set GACHA_PACK_ADDRESS in your environment");
  const seriesRaw = process.env.PACK_SERIES ?? "0";
  const series = Number(seriesRaw);
  if (!Number.isInteger(series) || series < 0 || series > 2) {
    throw new Error("Set PACK_SERIES to 0, 1, or 2");
  }

  const [player] = await ethers.getSigners();
  console.log("Player:    ", player.address);
  console.log("GachaPack: ", packAddress);
  console.log("Series:    ", `${series} (${SERIES_LABELS[series]})`);
  console.log("");

  const gachaPack = await ethers.getContractAt("GachaPack", packAddress);

  for (const [packName, cfg] of Object.entries(PACK_TYPES)) {
    console.log(`--- Opening ${packName} Pack (${cfg.price} WND)... ---`);
    const tx = await (gachaPack as any)[cfg.method](series, {
      value: ethers.parseEther(cfg.price),
      ...GAS,
    });
    const receipt = await tx.wait();

    // Parse PackOpened event
    const packOpenedIface = new ethers.Interface([
      "event PackOpened(address indexed player, uint8 packType, uint8 series, uint256[] tokenIds)",
    ]);

    for (const log of receipt.logs ?? []) {
      try {
        const parsed = packOpenedIface.parseLog(log);
        if (parsed && parsed.name === "PackOpened") {
          const tokenIds: bigint[] = parsed.args.tokenIds;
          console.log(`  ✅ Received ${tokenIds.length} cards: [${tokenIds.join(", ")}]`);
        }
      } catch {
        // ignore other event logs
      }
    }
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
    console.log("");
  }

  console.log("Demo complete! Check your wallet inventory for the minted NFTs.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
