"use client";

import { useRef, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/wallet-context";
import { GACHA_PACK_ADDRESS, GACHA_PACK_ABI } from "@/lib/contracts";
import { switchToWestend } from "@/lib/switchToWestend";
import { simulatePack, PackSeries } from "@/lib/gacha-engine";

export type PackType = "standard" | "premium" | "ultra";
export type { PackSeries };

const PACK_CONFIG: Record<PackType, { method: string; price: string }> = {
  standard: { method: "openStandardPack", price: "0.001" },
  premium: { method: "openPremiumPack", price: "0.0018" },
  ultra: { method: "openUltraPack", price: "0.0025" },
};

const WESTEND_READ_RPC = "https://westend-asset-hub-eth-rpc.polkadot.io";
const PACK_OPENED_TOPIC = ethers.id("PackOpened(address,uint8,uint8,uint256[])");
const TRANSFER_BATCH_TOPIC =
  "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";
const ZERO_TOPIC =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const INDEX_LOOKUP_ATTEMPTS = 12;

function isSimulationMode(): boolean {
  const addr = GACHA_PACK_ADDRESS;
  return (
    !addr ||
    addr === "" ||
    addr === "0x0000000000000000000000000000000000000000"
  );
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface PackResult {
  tokenIds: number[];
  packType: PackType;
  series: PackSeries;
}

function extractTokenIdsFromLogs(
  logs: ReadonlyArray<{ topics?: readonly string[]; data?: string }>,
  packInterface: ethers.Interface,
  playerAddress: string,
): number[] {
  for (const log of logs) {
    const topics = [...(log.topics ?? [])];
    const data = log.data ?? "0x";
    if (topics.length === 0) continue;

    try {
      const parsed = packInterface.parseLog({ topics, data });
      if (parsed?.name !== "PackOpened") continue;
      const eventPlayer = String(parsed.args[0]).toLowerCase();
      if (eventPlayer !== playerAddress.toLowerCase()) continue;
      return (parsed.args[3] as bigint[]).map(Number);
    } catch {
      // Ignore non-GachaPack logs and continue to fallbacks.
    }
  }

  const tokenIds: number[] = [];
  for (const log of logs) {
    try {
      const topics = log.topics ?? [];
      if (
        topics[0]?.toLowerCase() === TRANSFER_BATCH_TOPIC &&
        topics[2] === ZERO_TOPIC
      ) {
        const [ids] = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256[]", "uint256[]"],
          log.data ?? "0x",
        );
        tokenIds.push(...(ids as bigint[]).map(Number));
      }
    } catch (error) {
      console.warn("[GachaPack] TransferBatch decode error:", error);
    }
  }

  return tokenIds;
}

async function waitForIndexedReceipt(
  provider: ethers.JsonRpcProvider,
  txHash: string,
  initialReceipt: ethers.TransactionReceipt | null,
  delayMs: number,
): Promise<ethers.TransactionReceipt | null> {
  let receipt = initialReceipt;
  if (receipt?.logs?.length) return receipt;

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt++) {
    await sleep(delayMs);
    receipt = await provider.getTransactionReceipt(txHash);
    if (receipt?.logs?.length) return receipt;
  }

  return receipt;
}

async function findPackOpenedTokenIds(
  provider: ethers.JsonRpcProvider,
  blockNumber: number,
  playerAddress: string,
  packInterface: ethers.Interface,
): Promise<number[]> {
  const paddedPlayer = ethers.zeroPadValue(playerAddress, 32);

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(1500);

    try {
      const logs = await provider.getLogs({
        address: GACHA_PACK_ADDRESS,
        fromBlock: blockNumber,
        toBlock: blockNumber,
        topics: [PACK_OPENED_TOPIC, paddedPlayer],
      });
      const tokenIds = extractTokenIdsFromLogs(logs, packInterface, playerAddress);
      if (tokenIds.length > 0) return tokenIds;
    } catch (error) {
      console.warn("[GachaPack] PackOpened log lookup failed:", error);
    }
  }

  return [];
}

async function findPackOpenedTokenIdsByTx(
  provider: ethers.JsonRpcProvider,
  txHash: string,
  startBlock: number,
  playerAddress: string,
  packInterface: ethers.Interface,
): Promise<number[]> {
  const paddedPlayer = ethers.zeroPadValue(playerAddress, 32);
  const fromBlock = Math.max(startBlock - 2, 0);

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(2000);

    try {
      const latestBlock = await provider.getBlockNumber();
      const logs = await provider.getLogs({
        address: GACHA_PACK_ADDRESS,
        fromBlock,
        toBlock: latestBlock,
        topics: [PACK_OPENED_TOPIC, paddedPlayer],
      });

      const matchingLogs = logs.filter(
        (log) => log.transactionHash.toLowerCase() === txHash.toLowerCase(),
      );
      const tokenIds = extractTokenIdsFromLogs(
        matchingLogs,
        packInterface,
        playerAddress,
      );
      if (tokenIds.length > 0) return tokenIds;
    } catch (error) {
      console.warn("[GachaPack] tx-hash PackOpened lookup failed:", error);
    }
  }

  return [];
}

export function usePackOpening() {
  const { wallet, getEthersProvider } = useWallet();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<PackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simMode] = useState(isSimulationMode);
  const openingRef = useRef(false);

  const openPack = async (packType: PackType, series: PackSeries) => {
    if (openingRef.current) return;
    openingRef.current = true;
    setIsOpening(true);
    setError(null);
    setResult(null);

    try {
      if (!simMode) {
        if (!wallet || wallet.type !== "metamask") {
          setError("Pack opening requires MetaMask.");
          return;
        }

        await switchToWestend();
        const provider = await getEthersProvider();
        if (!provider) throw new Error("Could not get provider.");

        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        const readProvider = new ethers.JsonRpcProvider(WESTEND_READ_RPC);
        const contract = new ethers.Contract(GACHA_PACK_ADDRESS, GACHA_PACK_ABI, signer);
        const packInterface = new ethers.Interface(GACHA_PACK_ABI);
        const cfg = PACK_CONFIG[packType];
        const startBlock = await readProvider.getBlockNumber();

        const FRONTIER_GAS = {
          maxFeePerGas: BigInt("200000000"),
          maxPriorityFeePerGas: BigInt("100000000"),
          gasLimit: BigInt("10000000000"),
        };

        const seriesIndex = series === "onepiece" ? 1 : 0;
        const tx = await contract[cfg.method](seriesIndex, {
          value: ethers.parseEther(cfg.price),
          ...FRONTIER_GAS,
        });

        const minedReceipt = await readProvider.waitForTransaction(tx.hash, 1, 60_000);
        const delayMs =
          packType === "ultra" ? 2500 : packType === "premium" ? 2000 : 1500;
        const indexedReceipt = await waitForIndexedReceipt(
          readProvider,
          tx.hash,
          minedReceipt,
          delayMs,
        );

        let tokenIds = extractTokenIdsFromLogs(
          indexedReceipt?.logs ?? minedReceipt?.logs ?? [],
          packInterface,
          signerAddress,
        );

        if (tokenIds.length === 0) {
          tokenIds = await findPackOpenedTokenIdsByTx(
            readProvider,
            tx.hash,
            startBlock,
            signerAddress,
            packInterface,
          );
        }

        if (tokenIds.length === 0) {
          const blockNumber = indexedReceipt?.blockNumber ?? minedReceipt?.blockNumber;
          if (typeof blockNumber === "number") {
            tokenIds = await findPackOpenedTokenIds(
              readProvider,
              blockNumber,
              signerAddress,
              packInterface,
            );
          }
        }

        if (tokenIds.length === 0) {
          console.warn("[GachaPack] Could not recover card IDs.", {
            txHash: tx.hash,
            minedLogs: minedReceipt?.logs ?? [],
            indexedLogs: indexedReceipt?.logs ?? [],
          });
          setError("Transaction confirmed but could not read card IDs. Check your inventory.");
          return;
        }

        setResult({ tokenIds, packType, series });
        return;
      }

      let walletSignature: string | undefined;

      if (wallet?.type === "metamask") {
        const provider = await getEthersProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const addr = await signer.getAddress();
          const msg = `Anime Gacha TCG - open ${packType} ${series} pack\nNonce: ${Date.now()}`;
          walletSignature = await signer.signMessage(msg);
          void addr;
        }
      } else {
        await sleep(800);
      }

      const simResult = simulatePack(packType, series, walletSignature);
      setResult({
        tokenIds: simResult.cards.map((card) => card.tokenId),
        packType,
        series,
      });
    } catch (err: unknown) {
      console.error("[GachaPack] raw error:", err);

      const extractMsg = (e: unknown): string => {
        if (!e || typeof e !== "object") return String(e);
        const obj = e as Record<string, unknown>;
        if (typeof obj.shortMessage === "string") return obj.shortMessage;
        if (typeof obj.reason === "string") return obj.reason;
        if (typeof obj.message === "string") return obj.message;
        if (obj.info && typeof obj.info === "object") {
          const infoError = (obj.info as Record<string, unknown>).error;
          if (
            infoError &&
            typeof infoError === "object" &&
            typeof (infoError as Record<string, unknown>).message === "string"
          ) {
            return (infoError as Record<string, string>).message;
          }
        }
        try {
          return JSON.stringify(e);
        } catch {
          return "[unknown error]";
        }
      };

      const msg = extractMsg(err);
      if (
        msg.includes("user rejected") ||
        msg.includes("User denied") ||
        msg.includes("ACTION_REJECTED")
      ) {
        setError("Transaction cancelled.");
      } else if (msg.includes("Already Imported")) {
        setError("A pack-open transaction is already pending in MetaMask. Wait for it to settle, then try again.");
      } else if (msg.includes("insufficient funds")) {
        setError("Insufficient WND balance.");
      } else {
        setError(`Failed: ${msg.slice(0, 200)}`);
      }
    } finally {
      openingRef.current = false;
      setIsOpening(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { openPack, isOpening, result, error, reset, simMode };
}
