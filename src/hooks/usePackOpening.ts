"use client";

import { useRef, useState } from "react";
import { signMessage } from "@stellar/freighter-api";
import { useWallet } from "@/context/wallet-context";
import { simulatePack, PackSeries } from "@/lib/gacha-engine";
import { getClientNetworkPassphrase, signAndSubmitPayment } from "@/lib/stellar/client-payments";
import { getAssetLabel } from "@/lib/stellar/assets";
import type { PaymentAssetCode } from "@/lib/stellar/types";

export type PackType = "standard" | "premium" | "ultra";
export type { PackSeries };

const PACK_CONFIG: Record<
  PackType,
  { xlm: string; usdc: string; php: number; cards: number; guarantee: string; duplicateCap: number }
> = {
  standard: {
    xlm: "15",
    usdc: "4",
    php: 240,
    cards: 10,
    guarantee: "At least 1 Rare or better",
    duplicateCap: 1,
  },
  premium: {
    xlm: "27",
    usdc: "7",
    php: 420,
    cards: 20,
    guarantee: "At least 2 Rare or better",
    duplicateCap: 2,
  },
  ultra: {
    xlm: "38",
    usdc: "10",
    php: 600,
    cards: 30,
    guarantee: "At least 3 Rare or better and 1 Legendary or better",
    duplicateCap: 3,
  },
};

const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS ?? "";
const GENERIC_ERROR_SNIPPETS = [
  "internal error",
  "[object object]",
  "[unknown error]",
] as const;
const RARITY_ODDS = [
  { rarity: "Common", weight: "82.00%" },
  { rarity: "Rare", weight: "14.00%" },
  { rarity: "Legendary", weight: "3.80%" },
  { rarity: "Mythic", weight: "0.20%" },
] as const;

function isSimulationMode(): boolean {
  return !PLATFORM_ADDRESS;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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

function extractMsg(error: unknown): string {
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
  demoMode?: boolean;
}

export function usePackOpening() {
  const { wallet } = useWallet();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<PackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentAsset, setPaymentAsset] = useState<PaymentAssetCode>("XLM");
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
        if (!wallet) {
          setError("Connect Freighter to buy packs.");
          return;
        }

        const checkoutResponse = await fetch("/api/pack-purchases/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            seriesOrDropId: series,
            packTier: packType,
            paymentAsset,
          }),
        });
        const checkout = (await checkoutResponse.json()) as
          | {
              checkoutId: string;
              recipient: string;
              amount: string;
              asset: PaymentAssetCode;
              memo: string;
            }
          | { error?: string };
        if (!checkoutResponse.ok || !("checkoutId" in checkout)) {
          setError(("error" in checkout && checkout.error) || "Failed to create Stellar checkout.");
          return;
        }

        const submitted = await signAndSubmitPayment({
          walletAddress: wallet.address,
          amount: checkout.amount,
          memo: checkout.memo,
          paymentAsset,
        });
        const verifyResponse = await fetch("/api/pack-purchases/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            checkoutId: checkout.checkoutId,
            transactionHash: submitted.hash,
          }),
        });
        const verified = (await verifyResponse.json()) as
          | {
              purchaseId: string;
              packResult: { tokenIds: number[]; series: string; packTier: string };
            }
          | { error?: string };
        if (!verifyResponse.ok || !("packResult" in verified)) {
          setError(("error" in verified && verified.error) || "Failed to verify Stellar payment.");
          return;
        }

        setResult({
          tokenIds: verified.packResult.tokenIds,
          packType,
          series,
          demoMode: false,
        });
        return;
      }

      let walletSignature: string | undefined;

      if (wallet?.type === "freighter") {
        const signed = await signMessage(
          `Aniverse Nexus Demo Pack\nPack: ${packType}\nSeries: ${series}\nNonce: ${Date.now()}`,
          { address: wallet.address, networkPassphrase: getClientNetworkPassphrase() },
        );
        if (signed.signedMessage) {
          if (typeof signed.signedMessage === "string") {
            walletSignature = signed.signedMessage;
          } else {
            let binary = "";
            const bytes = new Uint8Array(signed.signedMessage);
            for (const byte of bytes) {
              binary += String.fromCharCode(byte);
            }
            walletSignature = window.btoa(binary);
          }
        }
      } else {
        await sleep(800);
      }

      const simResult = simulatePack(packType, series, walletSignature);
      setResult({
        tokenIds: simResult.cards.map((card) => card.tokenId),
        packType,
        series,
        demoMode: true,
      });
    } catch (err: unknown) {
      const msg = extractMsg(err);
      const normalizedMsg = msg.toLowerCase();

      if (
        normalizedMsg.includes("user rejected") ||
        normalizedMsg.includes("user denied") ||
        normalizedMsg.includes("action_rejected")
      ) {
        setError("Transaction cancelled.");
      } else if (normalizedMsg.includes("insufficient")) {
        setError(`Insufficient ${getAssetLabel(paymentAsset)} balance.`);
      } else {
        console.error("[StellarPack] unexpected error:", err);
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

  return {
    openPack,
    isOpening,
    result,
    error,
    reset,
    simMode,
    paymentAsset,
    setPaymentAsset,
    packConfig: PACK_CONFIG,
    rarityOdds: RARITY_ODDS,
  };
}

