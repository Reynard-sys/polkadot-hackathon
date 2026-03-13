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
      // NOTE: OZ v5 uses mcopy (a Cancun-only opcode), so we cannot downgrade.
      // Westend AssetHub's Frontier node DOES execute Cancun opcodes at runtime;
      // the previous "Metadata error" was caused by gas auto-estimation, not EVM version.
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
    // Westend AssetHub EVM (Polkadot testnet) — Chain ID: 420420421
    // Fix: supply explicit gasPrice + gas so Hardhat does NOT call eth_estimateGas,
    // which returns a "Metadata error" on Frontier nodes.
    westend_assethub: {
      url: process.env.WESTEND_RPC_URL ?? "https://westend-asset-hub-eth-rpc.polkadot.io",
      chainId: 420420421,
      accounts: /^[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY ?? "")
        ? [process.env.PRIVATE_KEY as string]
        : [],
      gas: 10_000_000,
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
