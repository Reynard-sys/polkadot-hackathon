"use client";

import { useRef, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/wallet-context";
import { GACHA_PACK_ABI, GACHA_PACK_ADDRESS } from "@/lib/contracts";
import { simulatePack, PackSeries } from "@/lib/gacha-engine";
import { switchToWestend } from "@/lib/switchToWestend";

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
const FRONTIER_GAS = {
  maxFeePerGas: BigInt("200000000"),
  maxPriorityFeePerGas: BigInt("100000000"),
  gasLimit: BigInt("10000000000"),
} as const;
const GENERIC_ERROR_SNIPPETS = [
  "could not coalesce error",
  "internal json-rpc error",
  "missing revert data",
  "[object object]",
  "[unknown error]",
];
const PENDING_TX_SNIPPETS = [
  "already imported",
  "already known",
  "priority is too low",
  "replacement transaction underpriced",
  "too low priority to replace another transaction already in the pool",
  "nonce too low",
  "invalid transaction",
];

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

function decodePackError(
  errorData: string,
  packInterface: ethers.Interface,
): string | null {
  try {
    const parsed = packInterface.parseError(errorData);
    if (!parsed) return null;

    if (parsed.name === "InsufficientPayment") {
      const sent = parsed.args[0] as bigint;
      const required = parsed.args[1] as bigint;
      return `Insufficient payment: sent ${ethers.formatEther(sent)} WND, requires ${ethers.formatEther(required)} WND.`;
    }

    if (parsed.name === "InvalidSeries") {
      return `Invalid pack series: ${String(parsed.args[0])}.`;
    }

    return parsed.name;
  } catch {
    return null;
  }
}

function collectErrorMessages(
  value: unknown,
  bucket: Set<string>,
  seen: WeakSet<object>,
): void {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) bucket.add(trimmed);
    return;
  }

  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) collectErrorMessages(item, bucket, seen);
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const key of ["shortMessage", "reason", "message", "details"]) {
    const entry = obj[key];
    if (typeof entry === "string" && entry.trim()) {
      bucket.add(entry.trim());
    }
  }

  for (const key of ["error", "info", "cause", "data", "payload", "value"]) {
    if (key in obj) collectErrorMessages(obj[key], bucket, seen);
  }
}

function collectErrorData(
  value: unknown,
  bucket: Set<string>,
  seen: WeakSet<object>,
): void {
  if (typeof value === "string") {
    if (/^0x[0-9a-fA-F]{8,}$/.test(value)) bucket.add(value);
    return;
  }

  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) collectErrorData(item, bucket, seen);
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const key of ["data", "error", "info", "cause"]) {
    if (key in obj) collectErrorData(obj[key], bucket, seen);
  }
}

function extractMsg(error: unknown, packInterface: ethers.Interface): string {
  const dataBucket = new Set<string>();
  collectErrorData(error, dataBucket, new WeakSet<object>());
  for (const errorData of dataBucket) {
    const decoded = decodePackError(errorData, packInterface);
    if (decoded) return decoded;
  }

  const messageBucket = new Set<string>();
  collectErrorMessages(error, messageBucket, new WeakSet<object>());
  const messages = [...messageBucket];
  const nonGeneric = messages.find((message) => {
    const lowered = message.toLowerCase();
    return !GENERIC_ERROR_SNIPPETS.some((snippet) => lowered.includes(snippet));
  });
  if (nonGeneric) return nonGeneric;
  if (messages.length > 0) return messages[0];

  try {
    return JSON.stringify(error);
  } catch {
    return "[unknown error]";
  }
}

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
      // Ignore non-GachaPack logs and continue to the fallback decoders.
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

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt += 1) {
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

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt += 1) {
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

  for (let attempt = 0; attempt < INDEX_LOOKUP_ATTEMPTS; attempt += 1) {
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

async function getPendingNonceGap(
  provider: ethers.JsonRpcProvider,
  address: string,
): Promise<{ latest: number; pending: number; hasGap: boolean }> {
  const [latest, pending] = await Promise.all([
    provider.getTransactionCount(address, "latest"),
    provider.getTransactionCount(address, "pending"),
  ]);

  return {
    latest,
    pending,
    hasGap: pending > latest,
  };
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
    const packInterface = new ethers.Interface(GACHA_PACK_ABI);

    try {
      if (!simMode) {
        if (!wallet) {
          setError("Connect MetaMask to open packs.");
          return;
        }

        if (wallet.type !== "metamask") {
          setError("Pack opening requires MetaMask.");
          return;
        }

        const provider = await getEthersProvider(
          wallet.evmProviderPreference ?? "metamask",
        );
        if (!provider) {
          setError("Could not get provider.");
          return;
        }
        await switchToWestend(provider);

        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        const readProvider = new ethers.JsonRpcProvider(WESTEND_READ_RPC);
        const contract = new ethers.Contract(
          GACHA_PACK_ADDRESS,
          GACHA_PACK_ABI,
          signer,
        );
        const cfg = PACK_CONFIG[packType];
        const txValue = ethers.parseEther(cfg.price);
        const startBlock = await readProvider.getBlockNumber();
        const nonceState = await getPendingNonceGap(readProvider, signerAddress);

        if (nonceState.hasGap) {
          setError(
            `Westend still has a pending transaction for this wallet nonce. Wait for it to settle, or clear the wallet's pending activity before opening another pack.`,
          );
          return;
        }

        const seriesIndex =
          series === "onepiece" ? 1 : series === "pokemon" ? 2 : 0;

        const tx = await contract[cfg.method](seriesIndex, {
          value: txValue,
          ...FRONTIER_GAS,
        });

        const minedReceipt = await readProvider.waitForTransaction(
          tx.hash,
          1,
          60_000,
        );

        if (minedReceipt && minedReceipt.status === 0) {
          setError(
            "Transaction reverted on-chain. The deployed GachaPack contract likely does not support this pack series yet.",
          );
          return;
        }

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
          const blockNumber =
            indexedReceipt?.blockNumber ?? minedReceipt?.blockNumber;
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
          setError(
            "Transaction confirmed but could not read card IDs. Check your inventory.",
          );
          return;
        }

        setResult({ tokenIds, packType, series });
        return;
      }

      let walletSignature: string | undefined;

      if (wallet?.type === "metamask") {
        const provider = await getEthersProvider(
          wallet.evmProviderPreference ?? "metamask",
        );
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
      const msg = extractMsg(err, packInterface);
      const normalizedMsg = msg.toLowerCase();

      if (
        normalizedMsg.includes("user rejected") ||
        normalizedMsg.includes("user denied") ||
        normalizedMsg.includes("action_rejected")
      ) {
        setError("Transaction cancelled.");
      } else if (
        PENDING_TX_SNIPPETS.some((snippet) => normalizedMsg.includes(snippet))
      ) {
        setError(
          "A previous pack-open transaction is still pending on Westend for this wallet. Wait for it to settle, then try again.",
        );
      } else if (normalizedMsg.includes("insufficient funds")) {
        setError("Insufficient WND balance.");
      } else {
        console.error("[GachaPack] unexpected error:", err);
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
