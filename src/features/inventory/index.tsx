"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Footer from "@/components/footer";
import { useWallet } from "@/context/wallet-context";
import {
  useInventory,
  type OwnedCard,
  type CardRarity,
  type CardAnime,
} from "@/hooks/useInventory";

// ── Rarity metadata (Figma design) ────────────────────────────────────────────

type Rarity = "common" | "rare" | "legendary" | "mythic";

const RARITY_META: Record<
  Rarity,
  {
    frame: string;
    chip: string;
    border: string;
    detailLabel: string;
    valueColor: string;
    tagBg: string;
  }
> = {
  common: {
    frame: "/assets/deck-builder/cards/frame-common.svg",
    chip: "bg-[#616161]",
    border: "border-[#a2a2a2]",
    detailLabel: "Common",
    valueColor: "text-[#a2a2a2]",
    tagBg: "bg-[#616161]",
  },
  rare: {
    frame: "/assets/deck-builder/cards/frame-rare.svg",
    chip: "bg-[#009f3d]",
    border: "border-[#1fc16b]",
    detailLabel: "Rare",
    valueColor: "text-[#1fc16b]",
    tagBg: "bg-[#1fc16b]",
  },
  legendary: {
    frame: "/assets/deck-builder/cards/frame-legendary.svg",
    chip: "bg-[#c59f00]",
    border: "border-[#dfb400]",
    detailLabel: "Legendary",
    valueColor: "text-[#dfb400]",
    tagBg: "bg-[#dfb400]",
  },
  mythic: {
    frame: "/assets/deck-builder/cards/frame-mythic.svg",
    chip: "bg-[#3a65a9]",
    border: "border-[#ea4335]",
    detailLabel: "Mythic",
    valueColor:
      "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)] bg-clip-text text-transparent",
    tagBg:
      "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)]",
  },
};

// Map chain rarities → Figma rarity keys
function toFigmaRarity(r: CardRarity): Rarity {
  const map: Record<CardRarity, Rarity> = {
    Common: "common",
    Rare: "rare",
    Legendary: "legendary",
    Mythic: "mythic",
  };
  return map[r] ?? "common";
}

// ── Filter options ─────────────────────────────────────────────────────────────

const MOBILE_RARITY_FILTERS: Array<{ id: "all" | CardRarity; label: string }> =
  [
    { id: "all", label: "ALL" },
    { id: "Common", label: "COMMON" },
    { id: "Rare", label: "RARE" },
    { id: "Legendary", label: "LEGENDARY" },
    { id: "Mythic", label: "MYTHIC" },
  ];

const DESKTOP_RARITY_FILTERS: Array<{
  id: "all" | CardRarity;
  label: string;
}> = [
  { id: "all", label: "ALL" },
  { id: "Common", label: "Common" },
  { id: "Rare", label: "Rare" },
  { id: "Legendary", label: "Legendary" },
  { id: "Mythic", label: "Mythic" },
];

const ANIME_FILTERS: Array<{ id: "all" | CardAnime; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "Naruto", label: "Naruto" },
  { id: "OnePiece", label: "One Piece" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconLine({
  className = "h-6 w-6 text-white",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 5l-7 7 7 7" />
      <path d="M9 12h10" />
    </svg>
  );
}

function SetInfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 4h12v4c0 3.5-2.7 5.6-6 6-3.3-.4-6-2.5-6-6V4z" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </svg>
  );
}

function CardInfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[20px] w-[20px] text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <circle cx="8" cy="9" r="2.4" />
      <path d="M3.8 16.3c1-2.1 2.9-3.2 4.2-3.2s3.1 1.1 4.2 3.2" />
      <circle cx="16.2" cy="9.7" r="1.9" />
      <path d="M13.8 15.8c.7-1.3 1.8-2 2.9-2 .8 0 1.8.4 2.6 1.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[#99a1af]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[#707b90]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ── Mobile header ──────────────────────────────────────────────────────────────

function InventoryTopCard() {
  return (
    <section className="w-full">
      <Image
        src="/assets/mobile-game-features/mobile-inventory.svg"
        alt="My Inventory"
        width={375}
        height={113}
        className="h-auto w-full"
        priority
      />
    </section>
  );
}

function InventoryMainMobileHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-[rgba(151,151,151,0.2)] bg-[#272727] md:hidden">
      <div className="mx-auto flex h-full w-full max-w-[412px] items-center justify-between px-[16px]">
        <div className="h-[28px] w-[98px]" />
        <button
          type="button"
          className="flex h-[40px] w-[40px] items-center justify-center"
          aria-label="Open menu"
        >
          <IconLine />
        </button>
      </div>
    </div>
  );
}

function InventoryDetailMobileHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-[rgba(151,151,151,0.2)] bg-[#272727] md:hidden">
      <div className="mx-auto grid h-full w-full max-w-[412px] grid-cols-[40px_1fr_40px] items-center px-[16px]">
        <button
          type="button"
          onClick={onBack}
          className="flex h-[40px] w-[40px] items-center justify-center"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <p className="text-center text-[20px] leading-[16px] font-normal text-white">
          View
        </p>
        <button
          type="button"
          className="flex h-[40px] w-[40px] items-center justify-center"
          aria-label="Open menu"
        >
          <IconLine />
        </button>
      </div>
    </div>
  );
}

// ── Card sprite (grid thumbnail) ───────────────────────────────────────────────

function CardSprite({
  card,
  onClick,
}: {
  card: OwnedCard;
  onClick: (card: OwnedCard) => void;
}) {
  const figmaRarity = toFigmaRarity(card.rarity);
  const meta = RARITY_META[figmaRarity];

  return (
    <button
      type="button"
      onClick={() => onClick(card)}
      className={`group relative h-[255px] w-full overflow-hidden rounded-[6px] border ${meta.border} text-left shadow-[0_8px_20px_rgba(0,0,0,0.35)]`}
      aria-label={`View ${card.name}`}
    >
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full bg-[#1a2040] flex items-center justify-center">
          <span className="text-white/20 text-xs">#{card.tokenId}</span>
        </div>
      )}
    </button>
  );
}

// ── Detail card (large view) ───────────────────────────────────────────────────

function DetailCard({ card }: { card: OwnedCard }) {
  const figmaRarity = toFigmaRarity(card.rarity);
  const meta = RARITY_META[figmaRarity];

  return (
    <div className="relative h-[507px] w-full max-w-[360px] overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-[#1a2040] flex items-center justify-center">
          <span className="text-white/20 text-sm">No image</span>
        </div>
      )}
    </div>
  );
}

// ── Sell button stubs ──────────────────────────────────────────────────────────

function SellButtonMobile() {
  return (
    <button
      type="button"
      className="relative mx-auto h-[47.957px] w-full max-w-[348.459px]"
      aria-label="Sell card"
    >
      <span className="pointer-events-none absolute inset-[-16.22%_-3.72%_-37.84%_-3.72%]">
        <Image
          src="/assets/inventory/sell-button-union.svg"
          alt=""
          fill
          className="object-fill"
          aria-hidden
        />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-center text-[14.102px] leading-[21.937px] font-bold text-white">
        Sell
      </span>
    </button>
  );
}

function SellButtonDesktop() {
  return (
    <button
      type="button"
      className="relative h-[47.957px] w-full max-w-[434.323px]"
      aria-label="Sell card"
    >
      <span className="pointer-events-none absolute inset-[-16.22%_-2.98%_-37.84%_-2.98%]">
        <Image
          src="/assets/inventory/web/sell-button-union-desktop.svg"
          alt=""
          fill
          className="object-fill"
          aria-hidden
        />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">
        Sell
      </span>
    </button>
  );
}

// ── Desktop card modal ─────────────────────────────────────────────────────────

function DesktopCardModal({
  card,
  onClose,
}: {
  card: OwnedCard;
  onClose: () => void;
}) {
  const figmaRarity = toFigmaRarity(card.rarity);
  const meta = RARITY_META[figmaRarity];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <DetailCard card={card} />
          <div className="flex flex-col">
            {/* Title + rarity badge */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] leading-[39px] font-bold text-white">
                  {card.name}
                </h2>
                {card.subtitle && (
                  <p className="mt-1 text-[14px] leading-[20px] text-[#99a1af]">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <span
                className={`mt-2 inline-flex h-[26px] min-w-[92px] items-center justify-center rounded-full px-4 text-[12.936px] font-bold text-white ${meta.tagBg}`}
              >
                {meta.detailLabel}
              </span>
            </div>

            {/* Traits */}
            <div className="mt-6 space-y-1">
              <p className="text-[14px] text-[#99a1af]">Traits</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(card.traits ?? []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[12px] font-medium text-white"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Description box */}
            <div className="mt-5 flex-1 rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
              <p className="text-[16px] leading-[24px] font-bold text-white">Description</p>
              {card.abilityDescription && (
                <p className="mt-3 text-[14px] leading-[22.75px] text-[#99a1af]">
                  {card.abilityDescription}
                </p>
              )}
              {(card.leaderEligible ?? false) && card.leaderDescription && (
                <p className="mt-4 text-[14px] leading-[22.75px] text-[#99a1af]">
                  {card.leaderDescription}
                </p>
              )}
            </div>

            <div className="mx-auto mt-4 w-full max-w-[270px]">
              <Image
                src="/assets/inventory/web/filter-separator.svg"
                alt=""
                width={661}
                height={31}
                className="h-auto w-full"
                aria-hidden
              />
            </div>
            <div className="mt-4">
              <SellButtonDesktop />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Desktop filter modal ───────────────────────────────────────────────────────

function DesktopFilterModal({
  rarity,
  setRarity,
  anime,
  setAnime,
  onClose,
  onReset,
  onApply,
}: {
  rarity: "all" | CardRarity;
  setRarity: (value: "all" | CardRarity) => void;
  anime: "all" | CardAnime;
  setAnime: (value: "all" | CardAnime) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const activeCount = (rarity === "all" ? 0 : 1) + (anime === "all" ? 0 : 1);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between">
          <h2 className="text-[22px] font-bold text-white">Filter Search</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Rarity</p>
            <div className="flex flex-wrap gap-3">
              {DESKTOP_RARITY_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRarity(tab.id)}
                  className={`h-[40px] rounded-[6px] px-[16px] text-[16.075px] font-bold text-white ${rarity === tab.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)]" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Series</p>
            <div className="flex flex-wrap gap-3">
              {ANIME_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAnime(tab.id)}
                  className={`h-[40px] rounded-[6px] px-[16px] text-[16.075px] font-bold text-white ${anime === tab.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)]" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Amount</p>
            <button
              type="button"
              className="flex h-[70px] w-full items-center justify-between rounded-[6px] border border-[#f4f4f4] bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] px-4 text-[16px] text-[#e8e8e8]"
            >
              Low to High (Lowest First)
              <DownIcon />
            </button>
          </div>
        </div>
        <div className="mx-auto mt-6 w-full max-w-[660px]">
          <Image
            src="/assets/inventory/web/filter-separator.svg"
            alt=""
            width={661}
            height={31}
            className="h-auto w-full"
            aria-hidden
          />
        </div>
        <div className="mt-5 flex gap-[18px]">
          <button
            type="button"
            onClick={onReset}
            className="relative h-[48px] flex-1"
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
          <button
            type="button"
            onClick={onApply}
            className="relative h-[48px] flex-1"
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
            <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">{`Apply Filters (${activeCount})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ walletConnected }: { walletConnected: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-6xl">📦</div>
      <h2 className="text-white font-bold text-xl">No cards yet</h2>
      {walletConnected ? (
        <p className="text-white/50 text-sm max-w-xs">
          Open some packs to start building your collection!
        </p>
      ) : (
        <p className="text-white/50 text-sm max-w-xs">
          Connect your wallet to view your saved collection, or open packs to
          get started.
        </p>
      )}
      <Link href="/gacha">
        <motion.button
          className="mt-2 px-6 py-2.5 rounded-xl bg-[#8855FF] text-white font-semibold text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          Open Packs →
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 9;

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2D3548] text-white disabled:opacity-30 hover:bg-[#3a4560] transition-colors"
        aria-label="Previous page"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <span className="text-sm text-white/60">
        <span className="text-white font-semibold">{page}</span> / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2D3548] text-white disabled:opacity-30 hover:bg-[#3a4560] transition-colors"
        aria-label="Next page"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ── Main inventory page ───────────────────────────────────────────────────────

export default function Inventory() {
  const { wallet, openPicker } = useWallet();
  const { ownedCards } = useInventory(wallet?.address ?? null);

  // Mobile state
  const [activeFilter, setActiveFilter] = useState<"all" | CardRarity>("all");
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [mobilePage, setMobilePage] = useState(1);

  // Desktop state
  const [desktopSearch, setDesktopSearch] = useState("");
  const [desktopRarity, setDesktopRarity] = useState<"all" | CardRarity>("all");
  const [desktopAnime, setDesktopAnime] = useState<"all" | CardAnime>("all");
  const [draftRarity, setDraftRarity] = useState<"all" | CardRarity>("all");
  const [draftAnime, setDraftAnime] = useState<"all" | CardAnime>("all");
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const [desktopPage, setDesktopPage] = useState(1);
  const [desktopSelectedCard, setDesktopSelectedCard] =
    useState<OwnedCard | null>(null);

  // Expand each card by its count so every copy appears as its own grid slot
  const expandCards = (cards: OwnedCard[]) =>
    cards.flatMap((c) =>
      Array.from({ length: c.count }, (_, i) => ({ card: c, copyIndex: i })),
    );

  const mobileAllCards = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? ownedCards
        : ownedCards.filter((c) => c.rarity === activeFilter);
    return expandCards(filtered);
  }, [ownedCards, activeFilter]);

  const mobileTotalPages = Math.max(
    1,
    Math.ceil(mobileAllCards.length / MOBILE_PAGE_SIZE),
  );
  const mobileVisibleCards = useMemo(
    () =>
      mobileAllCards.slice(
        (mobilePage - 1) * MOBILE_PAGE_SIZE,
        mobilePage * MOBILE_PAGE_SIZE,
      ),
    [mobileAllCards, mobilePage],
  );

  const desktopAllCards = useMemo(() => {
    const q = desktopSearch.trim().toLowerCase();
    const filtered = ownedCards.filter(
      (c) =>
        (desktopRarity === "all" || c.rarity === desktopRarity) &&
        (desktopAnime === "all" || c.anime === desktopAnime) &&
        (q.length === 0 ||
          c.name.toLowerCase().includes(q) ||
          c.anime.toLowerCase().includes(q)),
    );
    return expandCards(filtered);
  }, [ownedCards, desktopSearch, desktopRarity, desktopAnime]);

  const desktopTotalPages = Math.max(
    1,
    Math.ceil(desktopAllCards.length / DESKTOP_PAGE_SIZE),
  );
  const desktopVisibleCards = useMemo(
    () =>
      desktopAllCards.slice(
        (desktopPage - 1) * DESKTOP_PAGE_SIZE,
        desktopPage * DESKTOP_PAGE_SIZE,
      ),
    [desktopAllCards, desktopPage],
  );

  // Reset pages when filters change
  const setActiveMobileFilter = useCallback((f: "all" | CardRarity) => {
    setActiveFilter(f);
    setMobilePage(1);
  }, []);
  const setDesktopSearchAndReset = useCallback((v: string) => {
    setDesktopSearch(v);
    setDesktopPage(1);
  }, []);

  const totalCards = ownedCards.reduce((s, c) => s + c.count, 0);

  const openFilters = () => {
    setDraftRarity(desktopRarity);
    setDraftAnime(desktopAnime);
    setDesktopFilterOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#171717] pb-32 pt-0 text-white md:pb-0 md:pt-24">
      {/* Mobile background glows */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[74px] md:hidden">
        <div className="absolute -left-[178px] -top-[43px] h-[243px] w-[243px] rounded-full bg-[#6f74ac]/42 blur-[132px]" />
        <div className="absolute -right-[110px] top-[172px] h-[226px] w-[186px] rounded-full bg-[#001fe8]/32 blur-[130px]" />
        <div className="absolute -left-[152px] top-[549px] h-[226px] w-[186px] rounded-full bg-[#00135f]/28 blur-[128px]" />
      </div>
      {/* Desktop background glows */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute -left-[225px] -top-[113px] h-[379px] w-[350px] rounded-full bg-[#6f74ac]/38 blur-[152px]" />
        <div className="absolute left-[26%] -top-[423px] h-[615px] w-[1189px] rounded-full bg-[#001fe8]/24 blur-[170px]" />
        <div className="absolute right-[-258px] top-[880px] h-[924px] w-[436px] rounded-full bg-[#001fe8]/24 blur-[170px]" />
      </div>

      {/* Mobile headers */}
      {!selectedCard ? (
        <InventoryMainMobileHeader />
      ) : (
        <InventoryDetailMobileHeader onBack={() => setSelectedCard(null)} />
      )}

      {/* ── Mobile layout ── */}
      <div className="relative z-10 mx-auto w-full max-w-[412px] px-[18px] pt-[101px] md:hidden">
        {ownedCards.length === 0 ? (
          <section className="space-y-4">
            <InventoryTopCard />
            <EmptyState walletConnected={!!wallet} />
          </section>
        ) : !selectedCard ? (
          <section className="space-y-4">
            <InventoryTopCard />
            {/* Wallet info */}
            {wallet ? (
              <p className="text-white/40 text-xs">
                {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                &nbsp;·&nbsp;
                <span className="text-white/60">
                  {ownedCards.length} unique · {totalCards} total
                </span>
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white/40 text-xs">No wallet connected —</p>
                <button
                  onClick={openPicker}
                  className="text-[#8855FF] text-xs underline underline-offset-2 cursor-pointer"
                >
                  Connect
                </button>
              </div>
            )}
            {/* Rarity filter tabs */}
            <div className="flex items-center justify-between gap-2">
              {MOBILE_RARITY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveMobileFilter(f.id)}
                  className={`h-[26px] rounded-[4px] px-[10px] text-[10.769px] font-bold ${
                    activeFilter === f.id
                      ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)] text-white"
                      : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Pagination — top */}
            <Pagination
              page={mobilePage}
              totalPages={mobileTotalPages}
              onPrev={() => setMobilePage((p) => Math.max(1, p - 1))}
              onNext={() =>
                setMobilePage((p) => Math.min(mobileTotalPages, p + 1))
              }
            />
            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {mobileVisibleCards.map(({ card, copyIndex }) => (
                  <motion.div
                    key={`${card.tokenId}-${copyIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CardSprite card={card} onClick={setSelectedCard} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Pagination
              page={mobilePage}
              totalPages={mobileTotalPages}
              onPrev={() => setMobilePage((p) => Math.max(1, p - 1))}
              onNext={() =>
                setMobilePage((p) => Math.min(mobileTotalPages, p + 1))
              }
            />
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex justify-center">
              <DetailCard card={selectedCard} />
            </div>
            <div className="mx-auto flex w-full max-w-[365px] flex-col items-center gap-5 px-[15.995px]">
              {/* Name + rarity badge */}
              <div className="mt-1 flex w-full max-w-[348px] items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] leading-[28px] font-bold text-white">
                    {selectedCard.name}
                  </p>
                  {selectedCard.subtitle && (
                    <p className="text-[14px] leading-[20px] font-normal text-[#e8e8e8]">
                      {selectedCard.subtitle}
                    </p>
                  )}
                </div>
                <span
                  className={`ml-2 mt-0.5 shrink-0 inline-flex h-[26px] min-w-[72px] items-center justify-center rounded-full px-3 text-[12px] leading-[17px] font-bold text-white ${RARITY_META[toFigmaRarity(selectedCard.rarity)].tagBg}`}
                >
                  {RARITY_META[toFigmaRarity(selectedCard.rarity)].detailLabel}
                </span>
              </div>

              {/* Traits */}
              <div className="w-full max-w-[348px] space-y-1">
                <p className="text-[12px] leading-[16px] text-[#e8e8e8]">Traits</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCard.traits ?? []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description box */}
              <div className="w-full max-w-[361px] rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
                <p className="text-[12px] leading-[24px] font-bold text-white">Description</p>
                {selectedCard.abilityDescription && (
                  <p className="mt-2 text-[13px] leading-[22px] font-normal text-[#99a1af]">
                    {selectedCard.abilityDescription}
                  </p>
                )}
                {(selectedCard.leaderEligible ?? false) && selectedCard.leaderDescription && (
                  <p className="mt-4 text-[13px] leading-[22px] font-normal text-[#99a1af]">
                    {selectedCard.leaderDescription}
                  </p>
                )}
              </div>

              <div className="w-full pb-2">
                <SellButtonMobile />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="relative z-10 mx-auto hidden w-full max-w-[1257px] px-6 pb-24 pt-6 md:block">
        <section className="space-y-8 text-center">
          <h1 className="text-[68px] leading-[1.05] font-bold text-white">
            Inventory
          </h1>
          {wallet ? (
            <p className="mx-auto max-w-[720px] text-[18px] leading-[27px] text-white/80">
              {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
              &nbsp;·&nbsp;
              {ownedCards.length} unique · {totalCards} total
            </p>
          ) : (
            <p className="mx-auto max-w-[720px] text-[18px] leading-[27px] text-white/80">
              Connect your wallet to view your collection.{" "}
              <button
                onClick={openPicker}
                className="text-[#8855FF] underline underline-offset-2"
              >
                Connect Wallet
              </button>
            </p>
          )}
          <Image
            src="/assets/inventory/web/hero-separator.svg"
            alt=""
            width={1257}
            height={75}
            className="h-auto w-full"
            aria-hidden
          />
          <div className="mx-auto mt-2 max-w-[1113px] space-y-8 text-left">
            {/* Search + Filter row */}
            <div className="flex items-center gap-4">
              <label className="relative flex h-[57px] flex-1 items-center rounded-[10px] border border-[#1f2540] bg-[#151932] pl-12 pr-4">
                <span className="pointer-events-none absolute left-4">
                  <SearchIcon />
                </span>
                <input
                  value={desktopSearch}
                  onChange={(e) => setDesktopSearchAndReset(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full bg-transparent text-[18px] text-white placeholder:text-[#99a1af] outline-none"
                />
              </label>
              <button
                type="button"
                onClick={openFilters}
                className="flex h-[57px] w-[121px] items-center justify-center gap-2 rounded-[10px] border border-[#1f2540] bg-[#151932] text-[18px] text-white"
              >
                <FilterIcon />
                Filters
              </button>
            </div>

            {/* Pagination — top */}
            <Pagination
              page={desktopPage}
              totalPages={desktopTotalPages}
              onPrev={() => setDesktopPage((p) => Math.max(1, p - 1))}
              onNext={() =>
                setDesktopPage((p) => Math.min(desktopTotalPages, p + 1))
              }
            />

            {/* Card grid */}
            {ownedCards.length === 0 ? (
              <EmptyState walletConnected={!!wallet} />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <AnimatePresence>
                    {desktopVisibleCards.map(({ card, copyIndex }) => (
                      <motion.button
                        key={`${card.tokenId}-${copyIndex}`}
                        type="button"
                        onClick={() => setDesktopSelectedCard(card)}
                        className="overflow-hidden rounded-[12px] text-left"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DetailCard card={card} />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
                <Pagination
                  page={desktopPage}
                  totalPages={desktopTotalPages}
                  onPrev={() => setDesktopPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setDesktopPage((p) => Math.min(desktopTotalPages, p + 1))
                  }
                />
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />

      {/* Desktop modals */}
      {desktopSelectedCard && (
        <DesktopCardModal
          card={desktopSelectedCard}
          onClose={() => setDesktopSelectedCard(null)}
        />
      )}
      {desktopFilterOpen && (
        <DesktopFilterModal
          rarity={draftRarity}
          setRarity={setDraftRarity}
          anime={draftAnime}
          setAnime={setDraftAnime}
          onClose={() => setDesktopFilterOpen(false)}
          onReset={() => {
            setDraftRarity("all");
            setDraftAnime("all");
          }}
          onApply={() => {
            setDesktopRarity(draftRarity);
            setDesktopAnime(draftAnime);
            setDesktopPage(1);
            setDesktopFilterOpen(false);
          }}
        />
      )}
    </main>
  );
}
