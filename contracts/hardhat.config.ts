import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Westend AssetHub EVM (Polkadot testnet)
    // Chain ID: 420420421
    westend_assethub: {
      url: process.env.WESTEND_RPC_URL ?? "https://westend-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421,
      // Only include accounts if PK looks like a valid 32-byte hex string
      accounts: /^[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY ?? "")
        ? [process.env.PRIVATE_KEY as string]
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
