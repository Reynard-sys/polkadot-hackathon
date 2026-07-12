"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import BuyModal from "./buy-modal";
import MarketplaceCard from "./marketplace-card";

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

type Rarity = "ALL" | "Common" | "Rare" | "Legendary" | "Mythic";
type Element = "ALL" | "Fire" | "Water" | "Earth" | "Air";
type SortOrder = "low-to-high" | "high-to-low";

function FilterPanel({
  onApply,
  onClose,
  initial,
}: {
  onApply: (f: { rarity: Rarity; element: Element; sort: SortOrder }) => void;
  onClose: () => void;
  initial: { rarity: Rarity; element: Element; sort: SortOrder };
}) {
  const [rarity, setRarity] = useState<Rarity>(initial.rarity);
  const [element, setElement] = useState<Element>(initial.element);
  const [sort, setSort] = useState<SortOrder>(initial.sort);

  const rarities: Rarity[] = ["ALL", "Common", "Rare", "Legendary", "Mythic"];
  const elements: Element[] = ["ALL", "Fire", "Water", "Earth", "Air"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-gradient-to-b from-[#0e1e4a] to-[#090f28] border border-[#1F2540] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Filter Search</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#1e3a6e] transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[#8a9fc8] text-xs mb-2">Rarity</p>
            <div className="flex flex-wrap gap-2">
              {rarities.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRarity(item)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    rarity === item
                      ? "bg-gradient-to-b from-[#0144BD] to-[#192871] text-white"
                      : "bg-gradient-to-b from-[#0e1e4a] to-[#090f28] text-[#8a9fc8]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#8a9fc8] text-xs mb-2">Card Element</p>
            <div className="flex flex-wrap gap-2">
              {elements.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setElement(item)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    element === item
                      ? "bg-gradient-to-b from-[#0144BD] to-[#192871] text-white"
                      : "bg-gradient-to-b from-[#0e1e4a] to-[#090f28] text-[#8a9fc8]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#8a9fc8] text-xs mb-2">Amount</p>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              className="w-full bg-[#111c3a] border border-white text-white text-sm rounded-xl px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:border-[#1A56DB]"
            >
              <option value="low-to-high">Low to High</option>
              <option value="high-to-low">High to Low</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setRarity("ALL");
              setElement("ALL");
              setSort("low-to-high");
            }}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-white"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply({ rarity, element, sort });
              onClose();
            }}
            className="flex-1 rounded-xl bg-[#1A56DB] py-3 text-sm font-bold text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceSection() {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<{
    rarity: Rarity;
    element: Element;
    sort: SortOrder;
  }>({ rarity: "ALL", element: "ALL", sort: "low-to-high" });
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingRecord | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/marketplace/listings");
        const payload = (await response.json()) as {
          listings?: ListingRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load listings.");
        }
        setListings(payload.listings ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load listings.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadListings();
  }, []);

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const items = listings.filter((listing) => {
      const card = listing.cardInstance;
      const searchPass =
        normalizedSearch.length === 0 ||
        card.name.toLowerCase().includes(normalizedSearch) ||
        card.sourceName.toLowerCase().includes(normalizedSearch) ||
        listing.sellerWalletAddress.toLowerCase().includes(normalizedSearch);
      const rarityPass = filters.rarity === "ALL" || card.rarity === filters.rarity;
      const elementPass =
        filters.element === "ALL" || card.element === filters.element;

      return searchPass && rarityPass && elementPass;
    });

    return items.sort((left, right) => {
      const leftPrice = Number.parseFloat(left.priceAmount);
      const rightPrice = Number.parseFloat(right.priceAmount);
      return filters.sort === "low-to-high"
        ? leftPrice - rightPrice
        : rightPrice - leftPrice;
    });
  }, [filters, listings, search]);

  return (
    <div className="bg-transparent font-sans py-10">
      <div className="lg:hidden relative w-full p-4 pt-18 flex justify-center">
        <Image
          src="/assets/mobile-game-features/mobile-marketplace.svg"
          alt="Marketplace"
          width={300}
          height={78}
          className="w-full h-auto pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="hidden lg:block bg-transparent pt-30 pb-0 w-full">
        <h1 className="text-7xl font-bold text-white text-center mb-4">Marketplace</h1>
        <p className="text-center text-gray-400 text-sm max-w-xl mx-auto mb-8">
          Trade pack pulls with real backend ownership and Stellar-settled purchases.
        </p>
        <div className="w-full overflow-hidden">
          <Image
            src="/assets/tournament-page/outline.svg"
            alt=""
            width={1600}
            height={120}
            className="max-w-4xl lg:max-w-4xl xl:max-w-7xl pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-2 lg:p-0 lg:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 relative border-[#1F2540]/60">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-[#0d1b3e]/80 border border-[#1F2540]/60 rounded-xl text-white/70 text-sm placeholder-white/50 focus:outline-none focus:border-[#1A56DB]/60 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#0d1b3e]/80 border border-[#1F2540]/60 rounded-xl text-white text-sm hover:border-[#1A56DB]/60 hover:text-white transition-all"
          >
            <Filter size={15} className="text-white" />
            Filters
          </button>
          <Link
            href="/marketplace/sell"
            className="rounded-xl bg-[#1A56DB] px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#2a67ee]"
          >
            Sell Your Artwork
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#151932] px-8 py-16 text-center text-white/70">
            Loading live listings...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 px-8 py-16 text-center text-red-200">
            {error}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="flex flex-col space-y-3 lg:space-y-4">
            {filteredCards.map((listing) => (
              <MarketplaceCard
                key={listing.id}
                listingId={listing.id}
                cardName={listing.cardInstance.name}
                cardInfo={listing.cardInstance.subtitle ?? listing.cardInstance.sourceName}
                cardOwner={listing.sellerWalletAddress}
                cardPrice={listing.priceAmount}
                cardAsset={listing.priceAsset}
                phpEquivalent={listing.phpEquivalent}
                cardImage={listing.cardInstance.imageUrl}
                rarity={listing.cardInstance.rarity}
                sourceType={listing.cardInstance.sourceType}
                playable={listing.cardInstance.playable}
                supplyText={
                  listing.cardInstance.supplyCap
                    ? `${listing.cardInstance.issuedCount ?? 0} / ${listing.cardInstance.supplyCap}`
                    : undefined
                }
                onBuy={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-[#151932] rounded-2xl py-16 px-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[linear-gradient(to_top,#0144BD_10%,#151932_45%)] flex items-center justify-center">
              <Filter className="text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">No Listings Found</h3>
            <p className="text-white/50 text-sm max-w-xs">
              Try adjusting the search filters or list a duplicate from your inventory.
            </p>
          </div>
        )}
      </div>

      {showFilter ? (
        <FilterPanel
          onApply={setFilters}
          onClose={() => setShowFilter(false)}
          initial={filters}
        />
      ) : null}

      <BuyModal
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        listing={selectedListing}
      />
    </div>
  );
}
