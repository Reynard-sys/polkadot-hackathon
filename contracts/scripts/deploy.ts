import { ethers } from "hardhat";
import cardsJson from "../../src/data/cards.json";

/**
 * deploy.ts
 * Deploys CardRegistry → GachaNFT → GachaPack in order,
 * wires permissions, and optionally seeds cards.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network <network>
 *
 * Set BASE_URI in .env or it defaults to a placeholder.
 */

// Build the 48-element supply cap array from cards.json, indexed 0–47
// (maps to token IDs 1–48)
function buildSupplyCaps(): bigint[] {
  const caps = new Array(48).fill(0n);
  for (const card of cardsJson) {
    const idx = parseInt(card.nftTokenId, 10) - 1; // 0-indexed
    caps[idx] = BigInt(card.maxSupply);
  }
  return caps;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const baseUri = process.env.BASE_URI ?? "https://ipfs.io/ipfs/PLACEHOLDER_CID/";

  console.log("===========================================");
  console.log("  Anime Gacha TCG — Contract Deployment");
  console.log("===========================================");
  console.log("Deployer:  ", deployer.address);
  console.log("Network:   ", (await ethers.provider.getNetwork()).name);
  console.log("Balance:   ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "WND");
  console.log("Base URI:  ", baseUri);
  console.log("");

  // -------------------------------------------------------
  // 1. Deploy CardRegistry
  // -------------------------------------------------------
  console.log("1. Deploying CardRegistry...");
  const CardRegistryFactory = await ethers.getContractFactory("CardRegistry");
  const registry = await CardRegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   ✅ CardRegistry:", registryAddr);

  // -------------------------------------------------------
  // 2. Deploy GachaNFT
  // -------------------------------------------------------
  console.log("2. Deploying GachaNFT...");
  const caps = buildSupplyCaps();

  const GachaNFTFactory = await ethers.getContractFactory("GachaNFT");
  const gachaNFT = await GachaNFTFactory.deploy(baseUri, caps as any);
  await gachaNFT.waitForDeployment();
  const nftAddr = await gachaNFT.getAddress();
  console.log("   ✅ GachaNFT:     ", nftAddr);

  // -------------------------------------------------------
  // 3. Deploy GachaPack
  // -------------------------------------------------------
  console.log("3. Deploying GachaPack...");
  const GachaPackFactory = await ethers.getContractFactory("GachaPack");
  const gachaPack = await GachaPackFactory.deploy(nftAddr, registryAddr);
  await gachaPack.waitForDeployment();
  const packAddr = await gachaPack.getAddress();
  console.log("   ✅ GachaPack:    ", packAddr);

  // -------------------------------------------------------
  // 4. Authorise GachaPack as minter on GachaNFT
  // -------------------------------------------------------
  console.log("4. Authorising GachaPack as minter on GachaNFT...");
  const setMinterTx = await (gachaNFT as any).setMinter(packAddr, true);
  await setMinterTx.wait();
  console.log("   ✅ Minter authorised");

  // -------------------------------------------------------
  // 5. Summary
  // -------------------------------------------------------
  console.log("");
  console.log("===========================================");
  console.log("  Deployment Complete");
  console.log("===========================================");
  console.log(`  CARD_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`  GACHA_NFT_ADDRESS=${nftAddr}`);
  console.log(`  GACHA_PACK_ADDRESS=${packAddr}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Add the above addresses to your .env");
  console.log("  2. Run: npx hardhat run scripts/seedCards.ts --network <network>");
  console.log("  3. Run: npx hardhat run scripts/openPackDemo.ts --network <network>");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
