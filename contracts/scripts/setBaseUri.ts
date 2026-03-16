import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GAS = {
  gasPrice: 10_000_000_000n,
  gasLimit: 10_000_000_000n,
};

async function main() {
  const nftAddr = process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS;
  const baseUri =
    process.env.BASE_URI ??
    "https://ipfs.io/ipfs/bafybeigaosmk75u5pefapg5ar243m4rgyuajlwgbzdebi5odogm4vv6cka/";

  if (!nftAddr) {
    throw new Error("Set NEXT_PUBLIC_GACHA_NFT_ADDRESS in contracts/.env");
  }

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const isLocal = network.chainId === 31337n;
  const confirms = isLocal ? 1 : 2;

  const gachaNFT = await ethers.getContractAt("GachaNFT", nftAddr);
  let beforeUri: string | null = null;

  try {
    beforeUri = await gachaNFT.uri(1n);
  } catch {
    beforeUri = null;
  }

  console.log("==========================================");
  console.log("  Updating GachaNFT Base URI");
  console.log("==========================================");
  console.log("Deployer:", deployer.address);
  console.log("Network: ", network.name, `(chainId ${network.chainId})`);
  console.log("GachaNFT:", nftAddr);
  console.log("Before:  ", beforeUri ?? "(uri read skipped: Frontier metadata limitation)");
  console.log("Target:  ", `${baseUri}1.json`);
  console.log("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (gachaNFT as any).setBaseUri(baseUri, GAS);
  console.log("Tx hash: ", tx.hash);
  await tx.wait(confirms);

  let afterUri1: string | null = null;
  let afterUri48: string | null = null;

  try {
    afterUri1 = await gachaNFT.uri(1n);
    afterUri48 = await gachaNFT.uri(48n);
  } catch {
    afterUri1 = null;
    afterUri48 = null;
  }

  console.log("");
  console.log("==========================================");
  console.log("  Base URI Updated");
  console.log("==========================================");
  console.log("Token 1 URI: ", afterUri1 ?? "(uri read skipped: Frontier metadata limitation)");
  console.log("Token 48 URI:", afterUri48 ?? "(uri read skipped: Frontier metadata limitation)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
