import { ethers } from "hardhat";

/**
 * openPackDemo.ts
 * Demonstrates opening one pack of each type and prints the results.
 *
 * Usage:
 *   GACHA_PACK_ADDRESS=0x... npx hardhat run scripts/openPackDemo.ts --network localhost
 */

const PACK_TYPES: Record<string, { method: string; price: string }> = {
  Standard: { method: "openStandardPack", price: "0.001" },
  Premium:  { method: "openPremiumPack",  price: "0.0018" },
  Ultra:    { method: "openUltraPack",    price: "0.0025" },
};

async function main() {
  const packAddress = process.env.GACHA_PACK_ADDRESS;
  if (!packAddress) throw new Error("Set GACHA_PACK_ADDRESS in your environment");

  const [player] = await ethers.getSigners();
  console.log("Player:    ", player.address);
  console.log("GachaPack: ", packAddress);
  console.log("");

  const gachaPack = await ethers.getContractAt("GachaPack", packAddress);

  for (const [packName, cfg] of Object.entries(PACK_TYPES)) {
    console.log(`--- Opening ${packName} Pack (${cfg.price} WND)... ---`);
    const tx = await (gachaPack as any)[cfg.method]({
      value: ethers.parseEther(cfg.price),
    });
    const receipt = await tx.wait();

    // Parse PackOpened event
    const packOpenedIface = new ethers.Interface([
      "event PackOpened(address indexed player, uint8 packType, uint256[] tokenIds)",
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
