import { ethers } from "hardhat";
import cardsJson from "../../src/data/cards.json";

function buildSupplyCaps(): bigint[] {
  const caps = new Array(48).fill(0n);
  for (const card of cardsJson) {
    const idx = parseInt(card.nftTokenId, 10) - 1;
    caps[idx] = BigInt(card.maxSupply);
  }
  return caps;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Westend AssetHub's Frontier EVM cannot run eth_estimateGas
 * (returns "Metadata error") so we always supply explicit gas.
 * These values are safe on localhost too.
 */
const GAS = {
  gasPrice: 10_000_000_000n,
  gasLimit: 10_000_000_000n,
};

async function main() {
  const [deployer]  = await ethers.getSigners();
  const network     = await ethers.provider.getNetwork();
  const isLocal     = network.chainId === 31337n;
  const CONFIRMS    = isLocal ? 1 : 2;   // local mines instantly, testnet needs 2
  const PAUSE       = isLocal ? 0 : 5000; // no sleep needed locally

  const baseUri = process.env.BASE_URI ??
    "https://ipfs.io/ipfs/bafybeiccbcahhjafae4vqgylzb57u64ac4ukjgmt2kpwugfi7rdwzrduvu/";

  console.log("===========================================");
  console.log("  Anime Gacha TCG — Contract Deployment");
  console.log("===========================================");
  console.log("Deployer: ", deployer.address);
  console.log("Network:  ", network.name, `(chainId ${network.chainId})`);
  console.log("Balance:  ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "WND");
  console.log("Confirms: ", CONFIRMS);
  console.log("");

  // -------------------------------------------------------
  // 1. Deploy CardRegistry
  // -------------------------------------------------------
  console.log("1. Deploying CardRegistry...");
  const CardRegistryFactory = await ethers.getContractFactory("CardRegistry");
  const registry = await CardRegistryFactory.deploy(GAS);
  await registry.deploymentTransaction()?.wait(CONFIRMS);
  const registryAddr = await registry.getAddress();
  console.log("   ✅ CardRegistry:", registryAddr);
  if (PAUSE) { console.log(`   ⏳ Waiting ${PAUSE / 1000}s...`); await sleep(PAUSE); }

  // -------------------------------------------------------
  // 2. Deploy GachaNFT
  // -------------------------------------------------------
  console.log("2. Deploying GachaNFT...");
  const caps = buildSupplyCaps();
  const GachaNFTFactory = await ethers.getContractFactory("GachaNFT");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gachaNFT = await GachaNFTFactory.deploy(baseUri, caps as any, GAS);
  await gachaNFT.deploymentTransaction()?.wait(CONFIRMS);
  const nftAddr = await gachaNFT.getAddress();
  console.log("   ✅ GachaNFT:    ", nftAddr);
  if (PAUSE) { console.log(`   ⏳ Waiting ${PAUSE / 1000}s...`); await sleep(PAUSE); }

  // -------------------------------------------------------
  // 3. Deploy GachaPack
  // -------------------------------------------------------
  console.log("3. Deploying GachaPack...");
  const GachaPackFactory = await ethers.getContractFactory("GachaPack");
  const gachaPack = await GachaPackFactory.deploy(nftAddr, registryAddr, GAS);
  await gachaPack.deploymentTransaction()?.wait(CONFIRMS);
  const packAddr = await gachaPack.getAddress();
  console.log("   ✅ GachaPack:   ", packAddr);
  if (PAUSE) { console.log(`   ⏳ Waiting ${PAUSE / 1000}s...`); await sleep(PAUSE); }

  // -------------------------------------------------------
  // 4. Authorise GachaPack as minter on GachaNFT
  // -------------------------------------------------------
  console.log("4. Authorising GachaPack as minter...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setMinterTx = await (gachaNFT as any).setMinter(packAddr, true, GAS);
  await setMinterTx.wait(CONFIRMS);
  console.log("   ✅ Minter authorised");

  // -------------------------------------------------------
  // 5. Summary
  // -------------------------------------------------------
  console.log("");
  console.log("===========================================");
  console.log("  Deployment Complete ✅");
  console.log("===========================================");
  console.log(`  CARD_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`  NEXT_PUBLIC_GACHA_NFT_ADDRESS=${nftAddr}`);
  console.log(`  NEXT_PUBLIC_GACHA_PACK_ADDRESS=${packAddr}`);
  console.log("");
  console.log("👉 Next steps:");
  console.log("  1. Set CARD_REGISTRY_ADDRESS in contracts/.env");
  console.log("  2. npx hardhat run scripts/seedCards.ts --network <network>");
  console.log("  3. Copy NEXT_PUBLIC_* into gacha/.env.local");
  console.log("  4. npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});