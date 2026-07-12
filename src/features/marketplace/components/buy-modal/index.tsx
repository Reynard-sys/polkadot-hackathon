"use client";

import { useState } from "react";
import Image from "next/image";
import { signAndSubmitPayment } from "@/lib/stellar/client-payments";

type ListingRecord = {
  id: string;
  sellerWalletAddress: string;
  priceAsset: "XLM" | "USDC";
  priceAmount: string;
  phpEquivalent: number | null;
  status: string;
  cardInstance: {
    id: string;
    serialNumber: number | null;
    ownerWalletAddress: string;
    tokenId: number | null;
    name: string;
    subtitle: string | null;
    anime: string;
    rarity: string;
    element: string | null;
    mana: number | null;
    power: number | null;
    hp: number | null;
    zone: string | null;
    zones: string[];
    leaderEligible: boolean;
    traits: string[];
    imageUrl: string;
    sourceType: "demo" | "artist" | "ip";
    sourceName: string;
    playable: boolean;
    supplyCap: number | null;
    issuedCount: number | null;
  };
};

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: ListingRecord | null;
}

const RARITY_COLORS: Record<string, string> = {
  Legendary: "bg-yellow-500 text-black",
  Rare: "bg-blue-500 text-white",
  Common: "bg-gray-500 text-white",
  Mythic: "bg-purple-500 text-white",
};

export default function BuyModal({ isOpen, onClose, listing }: BuyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const rarityClass = RARITY_COLORS[listing.cardInstance.rarity] || "bg-yellow-500 text-black";

  const handleBuy = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const checkoutResponse = await fetch("/api/marketplace/purchases/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId: listing.id,
          paymentAsset: listing.priceAsset,
        }),
      });
      const checkout = (await checkoutResponse.json()) as {
        checkoutId?: string;
        amount?: string;
        memo?: string;
        recipient?: string;
        error?: string;
      };
      if (!checkoutResponse.ok || !checkout.checkoutId || !checkout.amount || !checkout.memo || !checkout.recipient) {
        throw new Error(checkout.error ?? "Failed to create marketplace checkout.");
      }

      const walletAddress = listing.cardInstance.ownerWalletAddress === listing.sellerWalletAddress
        ? ""
        : undefined;
      void walletAddress;

      const sessionResponse = await fetch("/api/auth/session", { credentials: "include" });
      const session = (await sessionResponse.json()) as { walletAddress?: string | null };
      if (!session.walletAddress) {
        throw new Error("Authenticate your wallet before buying a listing.");
      }

      const submitted = await signAndSubmitPayment({
        walletAddress: session.walletAddress,
        amount: checkout.amount,
        memo: checkout.memo,
        paymentAsset: listing.priceAsset,
        recipient: checkout.recipient,
      });

      const verifyResponse = await fetch("/api/marketplace/purchases/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checkoutId: checkout.checkoutId,
          transactionHash: submitted.hash,
        }),
      });
      const verified = (await verifyResponse.json()) as { error?: string };
      if (!verifyResponse.ok) {
        throw new Error(verified.error ?? "Failed to verify marketplace purchase.");
      }

      setSuccess("Purchase settled. Refresh inventory to see your new card.");
    } catch (buyError) {
      setError(buyError instanceof Error ? buyError.message : "Failed to buy listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-10 pb-15 overflow-y-scroll">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative z-10 bg-transparent lg:bg-[#151932] rounded-2xl p-8 px-10 pt-15 mt-20 max-w-3xl w-full shadow-2xl flex flex-col md:flex-row gap-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#1e3a6e] transition-colors"
        >
          ×
        </button>

        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-auto h-80 lg:h-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={listing.cardInstance.imageUrl}
              alt={listing.cardInstance.name}
              width={200}
              height={300}
              className="object-cover w-full h-full"
              unoptimized={listing.cardInstance.imageUrl.startsWith("data:")}
              draggable="false"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">
                {listing.cardInstance.name}
              </h2>
              <p className="text-[#8a9fc8] text-sm">
                {listing.cardInstance.subtitle ?? listing.cardInstance.sourceName}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${rarityClass}`}>
              {listing.cardInstance.rarity}
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0F1329] p-4 text-sm text-white/75 space-y-2">
            <p>Seller: {listing.sellerWalletAddress}</p>
            <p>Source: {listing.cardInstance.sourceName}</p>
            <p>Playable: {listing.cardInstance.playable ? "Yes" : "Collector Only"}</p>
            {listing.cardInstance.supplyCap ? (
              <p>
                Supply: {listing.cardInstance.issuedCount ?? 0} / {listing.cardInstance.supplyCap}
              </p>
            ) : null}
          </div>

          <div className="bg-[#0F1329] border border-[#1e3a6e]/40 rounded-xl p-4">
            <p className="text-white font-semibold text-sm mb-2">Price</p>
            <p className="text-white text-lg font-bold">
              {listing.priceAmount} {listing.priceAsset}
            </p>
            {listing.phpEquivalent ? (
              <p className="text-[#8a9fc8] text-xs mt-1">≈ PHP {listing.phpEquivalent.toFixed(0)}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-green-300">{success}</p> : null}

          <button
            type="button"
            onClick={() => void handleBuy()}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#1A56DB] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2a67ee] disabled:opacity-60"
          >
            {isSubmitting ? "Processing..." : "Buy with Stellar"}
          </button>
        </div>
      </div>
    </div>
  );
}
