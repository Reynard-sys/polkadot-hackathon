"use client";

import Image from "next/image";

interface MarketplaceCardProps {
  listingId: string;
  cardName: string;
  cardInfo: string;
  cardOwner: string;
  cardPrice: string;
  cardAsset: "XLM" | "USDC";
  phpEquivalent?: number | null;
  rarity: string;
  sourceType: "demo" | "artist" | "ip";
  playable: boolean;
  supplyText?: string;
  cardImage?: string;
  onBuy?: () => void;
}

export default function MarketplaceCard({
  cardName,
  cardInfo,
  cardOwner,
  cardPrice,
  cardAsset,
  phpEquivalent,
  rarity,
  sourceType,
  playable,
  supplyText,
  cardImage,
  onBuy,
}: MarketplaceCardProps) {
  return (
    <div className="flex items-stretch w-full gap-5 rounded-xl border border-[#1e3a6e]/60 bg-[linear-gradient(to_bottom,#2D3548_8%,#030A30_100%)] px-4 py-3 transition-all duration-200 group hover:border-[#3B82F6]/40">
      <div className="w-31 shrink-0 rounded-lg bg-[#1A1F2E] flex items-center justify-center overflow-hidden relative">
        {cardImage ? (
          <Image src={cardImage} alt={cardName} fill unoptimized={cardImage.startsWith("data:")} className="object-cover" draggable="false" />
        ) : (
          <span className="text-[#3B82F6]/40 text-[10px] text-center leading-tight px-1">No Image</span>
        )}
      </div>

      <div className="flex flex-col w-full justify-between py-1 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-white font-bold text-md lg:text-lg">{cardName}</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
              {rarity}
            </span>
            <span className="rounded-full bg-[#12326e] px-2 py-0.5 text-[11px] font-semibold text-white">
              {sourceType === "demo" ? "Demo" : sourceType === "artist" ? "Artist" : "IP"}
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
              {playable ? "Playable" : "Collector Only"}
            </span>
          </div>
          <p className="text-white/50 text-sm truncate">{cardInfo}</p>
          <p className="text-white/50 text-sm">Seller: {cardOwner}</p>
          {supplyText ? <p className="text-white/40 text-xs mt-1">Supply: {supplyText}</p> : null}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg lg:text-2xl">{cardPrice}</span>
              <span className="font-normal text-xs mt-1 text-white/70">{cardAsset}</span>
            </div>
            {phpEquivalent ? (
              <p className="text-white/40 text-xs mt-1">≈ PHP {phpEquivalent.toFixed(0)}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onBuy}
            className="rounded-xl bg-[#1A56DB] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2a67ee]"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}
