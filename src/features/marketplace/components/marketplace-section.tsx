"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import MarketplaceCard from "./marketplace-card";
import SellModal from "./sell-modal";
import { Filter } from "lucide-react";
import SvgButton from "@/components/svg-button";

// Mock Data

export const MARKETPLACE_CARDS = [
    {
        id: 1,
        name: "Naruto Uzamaki",
        info: "Leader/Frontline/Buff",
        owner: "Reynard Pogi",
        price: 1250000,
        priceDisplay: "1,250,000",
        priceChange: "↑143.1%",
        priceChangePositive: true,
        rarity: "Mythic",
        set: "Naruto Pack",
        description:
            "Chosen by Hagoromo Ōtsutsuki, Naruto awakened the power of the Sage of Six Paths, gaining divine chakra, and the ability to wield truth-seeking orbs.",
        image: "assets/marketplace/naruto.svg",
    },
    {
        id: 2,
        name: "Gol D. Roger",
        info: "Leader/Frontline/Finisher",
        owner: "Denawnn",
        price: 1550000,
        priceDisplay: "1,550,000",
        priceChange: "↑4.1%",
        priceChangePositive: true,
        rarity: "Mythic",
        set: "One Piece Pack",
        description:
            "The legendary Pirate King who conquered the Grand Line and discovered the final island, Laugh Tale, uncovering the world’s greatest treasure, the One Piece.",
        image: "assets/marketplace/roger.svg",
    },
    {
        id: 3,
        name: "Itachi Uchiha",
        info: "Leader/Frontline/Sleep",
        owner: "Joyyirel",
        price: 1000000,
        priceDisplay: "1,000,000",
        priceChange: "↑143.1%",
        priceChangePositive: true,
        rarity: "Legendary",
        set: "Naruto Pack",
        description:
            "Branded a traitor by the world, he lived in the shadows so that his younger brother and the village he loved could have a future.",
        image: "assets/marketplace/itachi.svg",
    },
    {
        id: 4,
        name: "Jiraiya",
        info: "Leader/Frontline/Summon",
        owner: "Gabo",
        price: 990800,
        priceDisplay: "990,800",
        priceChange: "↓67%",
        priceChangePositive: false,
        rarity: "Legendary",
        set: "Naruto Pack",
        description:
            "One of the Legendary Sannin of Konoha, Jiraiya is a wandering sage known for his powerful toad-based jutsu and larger-than-life personality.",
        image: "assets/marketplace/jiraiya.svg",
    },
    {
        id: 5,
        name: "Shanks",
        info: "Leader/Frontline/Cancel",
        owner: "Gabo",
        price: 1100000,
        priceDisplay: "1,100,000",
        priceChange: "↑67%",
        priceChangePositive: true,
        rarity: "Legendary",
        set: "One Piece Pack",
        description:
            "One of the Four Emperors of the Sea, Shanks is a legendary pirate whose presence alone can shake the balance of the world.",
        image: "assets/marketplace/shanks.svg",
    },
    {
        id: 6,
        name: "Donquixote Doflamingo",
        info: "Frontline/Manipulation",
        owner: "Roi",
        price: 670000,
        priceDisplay: "670,000",
        priceChange: "↓67%",
        priceChangePositive: false,
        rarity: "Rare",
        set: "One Piece Pack",
        description:
            "The ruthless king of Dressrosa and former Warlord of the Sea, Doflamingo rules the underworld utilizing the power of the String-String Fruit.",
        image: "assets/marketplace/doffy.svg",
    },
    {
        id: 7,
        name: "Trafalgar D. Water Law",
        info: "Backline/Positioning",
        owner: "Roi",
        price: 676767,
        priceDisplay: "676,767",
        priceChange: "↑67%",
        priceChangePositive: true,
        rarity: "Rare",
        set: "One Piece Pack",
        description:
            "Captain of the Heart Pirates who wields the Ope Ope no Mi. He sails the seas pursuing revenge and uncovering the truth behind the mysterious Will of D.",
        image: "assets/marketplace/law.svg",
    },
    {
        id: 8,
        name: "Edward Newgate",
        info: "Leader/Frontline/Tank",
        owner: "Roi",
        price: 1150000,
        priceDisplay: "1,150,000",
        priceChange: "↑67%",
        priceChangePositive: true,
        rarity: "Legendary",
        set: "One Piece Pack",
        description:
            "Known as the strongest man in the world, Whitebeard commanded the seas as one of the Four Emperors with the devastating power of the Tremor-Tremor Fruit.",
        image: "assets/marketplace/whitebeard.svg",
    },
];

// Padding Maps

const paddingMap = {
    ALL: "lg:px-4",
    Common: "lg:px-10",
    Rare: "lg:px-8",
    Legendary: "lg:px-15",
    Mythic: "lg:px-10",
};

const elementPaddingMap = {
    ALL: "lg:px-4",
    Fire: "lg:px-10",
    Water: "lg:px-8",
    Earth: "lg:px-10",
    Air: "lg:px-8",
    "Dual-Type": "lg:px-10",
};

// Filter Types

type Rarity = "ALL" | "Common" | "Rare" | "Legendary" | "Mythic";
type Element = "ALL" | "Fire" | "Water" | "Earth" | "Air" | "Dual-Type";
type SortOrder = "low-to-high" | "high-to-low";

// Filter Panel

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

    const RARITIES: Rarity[] = ["ALL", "Common", "Rare", "Legendary", "Mythic"];
    const ELEMENTS: Element[] = [
        "ALL",
        "Fire",
        "Water",
        "Earth",
        "Air",
        "Dual-Type",
    ];

    const activeCount =
        (rarity !== "ALL" ? 1 : 0) +
        (element !== "ALL" ? 1 : 0) +
        (sort !== "low-to-high" ? 1 : 0);

    const reset = () => {
        setRarity("ALL");
        setElement("ALL");
        setSort("low-to-high");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 bg-gradient-to-b from-[#0e1e4a] to-[#090f28] border border-[#1F2540] rounded-2xl p-6 max-w-lg lg:max-w-2xl w-full shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-white font-bold text-lg">Filter Search</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#1e3a6e] transition-colors"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                                d="M1 1L11 11M11 1L1 11"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Rarity */}
                <div className="mb-4">
                    <p className="text-[#8a9fc8] text-xs mb-2">Rarity</p>
                    <div className="flex justify-between">
                        {RARITIES.map((r) => (
                            <button
                                key={r}
                                onClick={() => setRarity(r)}
                                className={`${paddingMap[r] || "px-3"} px-3 py-1 rounded-lg text-xs font-semibold transition-all ${rarity === r
                                    ? "bg-gradient-to-b from-[#0144BD] to-[#192871] text-white"
                                    : "bg-gradient-to-b from-[#0e1e4a] to-[#090f28] text-[#8a9fc8] hover:bg-[#1e3a6e]/60"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card Element */}
                <div className="mb-4">
                    <p className="text-[#8a9fc8] text-xs mb-2">Card Element</p>
                    <div className="flex justify-between">
                        {ELEMENTS.map((e) => (
                            <button
                                key={e}
                                onClick={() => setElement(e)}
                                className={`${elementPaddingMap[e] || "px-3"} px-3 py-1 rounded-lg text-xs font-semibold transition-all ${element === e
                                    ? "bg-gradient-to-b from-[#0144BD] to-[#192871] text-white"
                                    : "bg-gradient-to-b from-[#0e1e4a] to-[#090f28] text-[#8a9fc8] hover:bg-[#1e3a6e]/60"
                                    }`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort by Price */}
                <div className="mb-6">
                    <p className="text-[#8a9fc8] text-xs mb-2">Amount</p>
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOrder)}
                            className="w-full bg-[#111c3a] border border-white text-white text-sm rounded-xl px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:border-[#1A56DB]"
                        >
                            <option value="low-to-high">Low to High (Lowest First)</option>
                            <option value="high-to-low">High to Low (Highest First)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                <path
                                    d="M1 1L6 7L11 1"
                                    stroke="#8a9fc8"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Divider diamond */}
                <div className="flex items-center gap-2 mb-5">
                    <Image
                        src="/assets/inventory/web/filter-separator.svg"
                        alt="Marketplace"
                        width={200}
                        height={10}
                        className="w-full h-auto pointer-events-none"
                        aria-hidden="true"
                        draggable="false"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={reset}
                        className="relative h-[48px] flex-1 hover:opacity-90 transition-opacity"
                    >
                        <span className="pointer-events-none absolute inset-[-16.22%_-3.11%_-37.84%_-3.11%]">
                            <Image
                                src="/assets/inventory/web/filter-reset-union.svg"
                                alt=""
                                fill
                                className="object-fill"
                                aria-hidden
                            />
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">
                            Reset All
                        </span>
                    </button>

                    {/* Apply Button */}
                    <button
                        type="button"
                        onClick={() => {
                            onApply({ rarity, element, sort });
                            onClose();
                        }}
                        className="relative h-[48px] flex-1 hover:opacity-90 transition-opacity"
                    >
                        <span className="pointer-events-none absolute inset-[-16.22%_-3.11%_-37.84%_-3.11%]">
                            <Image
                                src="/assets/inventory/web/filter-apply-union.svg"
                                alt=""
                                fill
                                className="object-fill"
                                aria-hidden
                            />
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">
                            Apply Filters ({activeCount})
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Marketplace Section

export default function MarketplaceSection() {
    const [search, setSearch] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState<{
        rarity: Rarity;
        element: Element;
        sort: SortOrder;
    }>({ rarity: "ALL", element: "ALL", sort: "low-to-high" });

    const [sellCard, setSellCard] = useState<
        (typeof MARKETPLACE_CARDS)[0] | null
    >(null);

    const filteredCards = useMemo(() => {
        let cards = [...MARKETPLACE_CARDS];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            cards = cards.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.info.toLowerCase().includes(q) ||
                    c.owner.toLowerCase().includes(q),
            );
        }

        // Rarity
        if (filters.rarity !== "ALL") {
            cards = cards.filter((c) => c.rarity === filters.rarity);
        }

        // Sort by price
        cards.sort((a, b) =>
            filters.sort === "low-to-high" ? a.price - b.price : b.price - a.price,
        );

        return cards;
    }, [search, filters]);

    return (
        <div className="bg-transparent font-sans py-10">
            {/* Mobile Banner */}
            <div className="lg:hidden relative w-full p-4 pt-18">
                <Image
                    src="/assets/mobile-game-features/mobile-marketplace.svg"
                    alt="Marketplace"
                    width={350}
                    height={78}
                    className="w-full h-auto pointer-events-none"
                    aria-hidden="true"
                />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block bg-transparent pt-30 pb-0 w-full">
                <h1 className="text-7xl font-bold text-white text-center mb-4">
                    Marketplace
                </h1>
                <p className="text-center text-gray-400 text-sm max-w-xl mx-auto mb-8">
                    Lorem ipsum dolor sit amet consectetur. Vitae volutus mauris penatibus
                    varius sagittis mi diam eget penatibus. Ut praesent at auctor turpis
                    cursus id.
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

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-4 pb-2 lg:p-0 lg:py-12 ">
                {/* Search + Filter Bar */}
                <div className="flex items-center gap-3 mb-6 ">
                    {/* Search */}
                    <div className="flex-1 relative border-[#1F2540]/60">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <circle
                                cx="7"
                                cy="7"
                                r="5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M11 11L14 14"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search cards..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-[#0d1b3e]/80 border border-[#1F2540]/60 rounded-xl text-white/50 text-sm placeholder-white/50 focus:outline-none focus:border-[#1A56DB]/60 transition-colors"
                        />
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilter(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-[#0d1b3e]/80 border border-[#1F2540]/60 rounded-xl text-white text-sm hover:border-[#1A56DB]/60 hover:text-white transition-all"
                    >
                        <Filter size={15} className="text-white" />
                        Filters
                    </button>
                </div>

                {/* Cards List */}
                {filteredCards.length > 0 ? (
                    <div className="flex flex-col space-y-3 lg:space-y-4">
                        {filteredCards.map((card) => (
                            <MarketplaceCard
                                key={card.id}
                                CardName={card.name}
                                CardInfo={card.info}
                                CardOwner={card.owner}
                                CardPrice={card.priceDisplay}
                                CardPriceChange={card.priceChange}
                                CardPriceChangePositive={card.priceChangePositive}
                                CardImage={card.image}
                                onBuy={() => { // kept empty just a placeholder for future function :>
                                }}
                                onSell={() => setSellCard(card)}
                            />
                        ))}
                    </div>
                ) : (
                    /* No Card Found State */
                    <div className="flex flex-col items-center justify-center bg-[#151932] rounded-2xl  py-16 px-8 space-y-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[linear-gradient(to_top,#0144BD_10%,#151932_45%)] flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect
                                    x="4"
                                    y="4"
                                    width="11"
                                    height="11"
                                    rx="2"
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                                <rect
                                    x="17"
                                    y="4"
                                    width="11"
                                    height="11"
                                    rx="2"
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                                <rect
                                    x="4"
                                    y="17"
                                    width="11"
                                    height="11"
                                    rx="2"
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                                <rect
                                    x="17"
                                    y="17"
                                    width="11"
                                    height="11"
                                    rx="2"
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg">No Card Found</h3>
                        <p className="text-white/50 text-sm max-w-xs">
                            The card you are trying to sell is not available in your
                            collection
                        </p>
                        <SvgButton
                            onClick={() => {
                                setSearch("");
                                setFilters({
                                    rarity: "ALL",
                                    element: "ALL",
                                    sort: "low-to-high",
                                });
                            }}
                            className="px-8 py-3 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Go back
                        </SvgButton>
                    </div>
                )}
            </div>

            {/* Filter Panel */}
            {showFilter && (
                <FilterPanel
                    onApply={setFilters}
                    onClose={() => setShowFilter(false)}
                    initial={filters}
                />
            )}

            {/* Sell Modal */}
            <SellModal
                isOpen={!!sellCard}
                onClose={() => setSellCard(null)}
                card={
                    sellCard
                        ? {
                            name: sellCard.name,
                            info: sellCard.info,
                            rarity: sellCard.rarity,
                            set: sellCard.set,
                            description: sellCard.description,
                            image: sellCard.image,
                        }
                        : undefined
                }
            />
        </div>
    );
}
