"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PageBackground from "@/components/page-background";
import cardsData from "@/data/cards.json";
import { useWallet } from "@/context/wallet-context";
import { useInventory, type OwnedCard } from "@/hooks/useInventory";

type CardVariant = "rare" | "mythic" | "common" | "legendary";
type CardZone = "Frontline" | "Backline" | "Reserve";

type CardItem = {
  id: number;
  name: string;
  faction: string;
  rarity: OwnedCard["rarity"];
  anime: OwnedCard["anime"];
  zone: CardZone | null;
  subtitle: string;
  traits: string[];
  abilityDescription: string;
  leaderEligible: boolean;
  leaderDescription: string | null;
  variant: CardVariant;
  accent: string;
  gradient: string;
  art: string;
  frame: string;
  ownedCount?: number;
};

type SavedDeck = {
  id: number;
  name: string;
  cards: Array<CardItem | null>;
};

type PersistedDeckState = {
  nextDeckId: number;
  savedDecks: SavedDeck[];
};

const TOTAL_SLOTS = 12;

const CARD_VARIANT_PRESETS: Record<
  CardVariant,
  Pick<CardItem, "accent" | "gradient" | "frame">
> = {
  rare: {
    accent: "#f87171",
    gradient: "from-rose-300/80 via-red-500/70 to-zinc-900/90",
    frame: "/assets/deck-builder/v2/cards/frame-rare.svg",
  },
  mythic: {
    accent: "#facc15",
    gradient: "from-yellow-300/90 via-orange-400/70 to-red-950/90",
    frame: "/assets/deck-builder/v2/cards/frame-mythic.svg",
  },
  common: {
    accent: "#34d399",
    gradient: "from-emerald-300/90 via-teal-500/70 to-slate-900/90",
    frame: "/assets/deck-builder/v2/cards/frame-common.svg",
  },
  legendary: {
    accent: "#22d3ee",
    gradient: "from-sky-300/90 via-blue-500/70 to-indigo-950/90",
    frame: "/assets/deck-builder/v2/cards/frame-legendary.svg",
  },
};

const RARITY_TO_VARIANT: Record<OwnedCard["rarity"], CardVariant> = {
  Common: "common",
  Rare: "rare",
  Legendary: "legendary",
  Mythic: "mythic",
};

const DESKTOP_RARITY_FILTERS: Array<{
  id: "all" | OwnedCard["rarity"];
  label: string;
}> = [
  { id: "all", label: "ALL" },
  { id: "Common", label: "Common" },
  { id: "Rare", label: "Rare" },
  { id: "Legendary", label: "Legendary" },
  { id: "Mythic", label: "Mythic" },
];

const ZONE_FILTERS: Array<{ id: "all" | CardZone; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "Frontline", label: "Frontline" },
  { id: "Backline", label: "Backline" },
  { id: "Reserve", label: "Reserve" },
];

const AVAILABLE_LIST_DROP_ID = "available-list";
const DECK_LIST_DROP_ID = "deck-list";

type CatalogCard = {
  nftTokenId: string;
  zone?: string;
};

function isCardZone(value: string): value is CardZone {
  return value === "Frontline" || value === "Backline" || value === "Reserve";
}

const CARD_ZONE_LOOKUP = new Map<number, CardZone>(
  (cardsData as CatalogCard[]).flatMap((card) => {
    const tokenId = Number.parseInt(card.nftTokenId, 10);
    if (!Number.isInteger(tokenId) || !card.zone || !isCardZone(card.zone)) {
      return [];
    }

    return [[tokenId, card.zone]];
  }),
);

type DragData =
  | {
      type: "available-card";
      card: CardItem;
    }
  | {
      type: "deck-card";
      card: CardItem;
      slotIndex: number;
    };

function mapOwnedCardToCardItem(card: OwnedCard): CardItem {
  const variant = RARITY_TO_VARIANT[card.rarity];
  const preset = CARD_VARIANT_PRESETS[variant];

  return {
    id: card.tokenId,
    name: card.name,
    faction: card.anime === "OnePiece" ? "One Piece" : card.anime,
    rarity: card.rarity,
    anime: card.anime,
    zone: CARD_ZONE_LOOKUP.get(card.tokenId) ?? null,
    subtitle: card.subtitle,
    traits: card.traits ?? [],
    abilityDescription: card.abilityDescription,
    leaderEligible: card.leaderEligible ?? false,
    leaderDescription: card.leaderDescription ?? null,
    variant,
    accent: preset.accent,
    gradient: preset.gradient,
    art: card.imageUrl,
    frame: preset.frame,
    ownedCount: card.count,
  };
}

function getDeckSlotDropId(index: number) {
  return `deck-slot-${index}`;
}

function getAvailableCardDragId(cardId: number) {
  return `available-card-${cardId}`;
}

function getDeckCardDragId(slotIndex: number) {
  return `deck-card-${slotIndex}`;
}

function parseDeckSlotDropId(id: string): number | null {
  if (!id.startsWith("deck-slot-")) return null;
  const parsed = Number(id.slice("deck-slot-".length));
  return Number.isInteger(parsed) ? parsed : null;
}

function buildCountMap(cards: Array<CardItem | null>) {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!card) continue;
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  }
  return counts;
}

function dedupeDeckCards(cards: Array<CardItem | null>) {
  const seen = new Set<number>();
  let changed = false;

  const next = cards.map((card) => {
    if (!card) {
      return null;
    }

    if (seen.has(card.id)) {
      changed = true;
      return null;
    }

    seen.add(card.id);
    return card;
  });

  return changed ? next : cards;
}

type SlotRole = "Leader" | CardZone;

function getSlotLabel(slotIndex: number): SlotRole {
  if (slotIndex === 0) return "Leader";
  if (slotIndex >= 1 && slotIndex <= 3) return "Frontline";
  if (slotIndex >= 4 && slotIndex <= 7) return "Backline";
  return "Reserve";
}

function canCardOccupySlot(card: CardItem, slotIndex: number) {
  const slotRole = getSlotLabel(slotIndex);

  if (slotRole === "Leader") {
    return card.leaderEligible;
  }

  return card.zone === slotRole;
}

function findCompatibleEmptySlot(
  slots: Array<CardItem | null>,
  card: CardItem,
  excludedIndex?: number,
) {
  return slots.findIndex(
    (slot, index) =>
      slot === null &&
      index !== excludedIndex &&
      canCardOccupySlot(card, index),
  );
}

function normalizeDeckCards(cards: Array<CardItem | null>) {
  const dedupedCards = dedupeDeckCards(cards);
  const normalized = emptySlots();

  for (const [index, card] of dedupedCards.entries()) {
    if (!card) continue;

    if (normalized[index] === null && canCardOccupySlot(card, index)) {
      normalized[index] = card;
      continue;
    }

    const fallbackIndex = findCompatibleEmptySlot(normalized, card);
    if (fallbackIndex >= 0) {
      normalized[fallbackIndex] = card;
    }
  }

  return normalized;
}

function padGrid<T>(items: T[], columns: number): Array<T | null> {
  if (items.length === 0) return [];
  const remainder = items.length % columns;
  if (remainder === 0) return items;
  return [...items, ...Array.from({ length: columns - remainder }, () => null)];
}

function sortInventoryCards(cards: CardItem[]) {
  const rarityOrder: Record<CardVariant, number> = {
    mythic: 0,
    legendary: 1,
    rare: 2,
    common: 3,
  };

  return [...cards].sort((a, b) => {
    const rarityDelta = rarityOrder[a.variant] - rarityOrder[b.variant];
    if (rarityDelta !== 0) return rarityDelta;
    return a.name.localeCompare(b.name);
  });
}

const CARD_META: Record<
  CardVariant,
  {
    artClass: string;
    ellipse: string;
    element: string;
    elementIcon: string;
    badgeClass: string;
    badgeStyle?: CSSProperties;
  }
> = {
  rare: {
    artClass: "h-[144%] w-[100.15%] left-[-0.07%] top-[-22%]",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-rare.svg",
    element: "/assets/deck-builder/v2/cards/element-rare.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-rare.png",
    badgeClass: "text-[#1fc16b]",
  },
  mythic: {
    artClass: "h-[139%] w-[96.79%] left-[1.61%] top-[-39%]",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-mythic.svg",
    element: "/assets/deck-builder/v2/cards/element-mythic.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-mythic.png",
    badgeClass: "text-transparent bg-clip-text",
    badgeStyle: {
      backgroundImage:
        "linear-gradient(180deg, rgb(234, 67, 53) 0%, rgb(249, 171, 0) 45.192%, rgb(150, 169, 42) 75%, rgb(66, 133, 244) 100%)",
    },
  },
  common: {
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-common.svg",
    element: "/assets/deck-builder/v2/cards/element-common.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-common.png",
    badgeClass: "text-[#a2a2a2]",
  },
  legendary: {
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-legendary.svg",
    element: "/assets/deck-builder/v2/cards/element-legendary.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-legendary.png",
    badgeClass: "text-[#dfb400]",
  },
};

function emptySlots() {
  return Array.from(
    { length: TOTAL_SLOTS },
    () => null,
  ) as Array<CardItem | null>;
}

function deckStorageKey(address: string) {
  return `deck_builder_${address.toLowerCase()}`;
}

function loadPersistedDeckState(address: string | null): PersistedDeckState {
  if (!address || typeof window === "undefined") {
    return {
      nextDeckId: 1,
      savedDecks: [],
    };
  }

  try {
    const raw = localStorage.getItem(deckStorageKey(address));
    if (!raw) {
      return {
        nextDeckId: 1,
        savedDecks: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedDeckState>;
    const savedDecks = Array.isArray(parsed.savedDecks)
      ? parsed.savedDecks
      : [];
    const nextDeckId =
      typeof parsed.nextDeckId === "number" &&
      Number.isFinite(parsed.nextDeckId)
        ? parsed.nextDeckId
        : savedDecks.reduce((maxId, deck) => Math.max(maxId, deck.id), 0) + 1;

    return {
      nextDeckId,
      savedDecks,
    };
  } catch {
    return {
      nextDeckId: 1,
      savedDecks: [],
    };
  }
}

function persistDeckState(address: string | null, payload: PersistedDeckState) {
  if (!address || typeof window === "undefined") {
    return;
  }

  localStorage.setItem(deckStorageKey(address), JSON.stringify(payload));
}

function BottomNavIcon({
  kind,
}: {
  kind: "home" | "market" | "gacha" | "deck" | "tournament";
}) {
  if (kind === "home") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-white/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
      </svg>
    );
  }

  if (kind === "market") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-white/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 4h2l2.4 11.5h10.7L21 7H7" />
        <circle cx="10" cy="19" r="1.4" />
        <circle cx="17" cy="19" r="1.4" />
      </svg>
    );
  }

  if (kind === "gacha") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-white/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="8" width="16" height="10" rx="2.5" />
        <circle cx="9" cy="13" r="1.5" />
        <circle cx="15" cy="13" r="1.5" />
        <path d="M12 8V6" />
      </svg>
    );
  }

  if (kind === "deck") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="5" y="4" width="14" height="16" rx="1.5" />
        <path d="M8 8h8M8 12h8M8 16h8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-white/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 4h12v4c0 3.5-2.7 5.6-6 6-3.3-.4-6-2.5-6-6V4z" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </svg>
  );
}

function DeckDesktopEmptyState({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1257px] flex-col items-center gap-[60px] pt-[149px] pb-20">
      <div className="flex w-full flex-col items-center gap-[52px]">
        <div className="w-full text-center">
          <h1 className="text-[68px] leading-[102px] font-bold text-white">
            Deck Builder
          </h1>
          <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
            Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus
            varius sagittis mi diam eget penatibus. Ut praesent ut auctor turpis
            cursus id.
          </p>
        </div>
        <Image
          src="/assets/deck-builder/web/hero-wing-separator-401.svg"
          alt=""
          width={1257}
          height={74.86}
          className="h-[74.86px] w-[1257px] object-fill mix-blend-plus-lighter"
        />
      </div>

      <article className="flex h-[491px] w-[1113px] flex-col items-center gap-[52px] rounded-[16px] border border-[#8085bd] bg-[linear-gradient(3.395deg,#120c35_11.336%,#143c87_57.519%,#13245e_112.14%)] px-[61px] py-[32px]">
        <div className="flex h-[150.86px] w-[150.86px] items-center justify-center rounded-full bg-[linear-gradient(178.123deg,rgba(20,60,135,0)_32.053%,#020c7b_95.528%)]">
          <Image
            src="/assets/deck-builder/web/empty-center-icon.svg"
            alt=""
            width={83.291}
            height={83.291}
          />
        </div>

        <div className="text-center">
          <h3 className="text-[32px] leading-[48px] font-bold text-white">
            No decks yet
          </h3>
          <p className="mt-[4px] text-[18px] leading-[27px] font-normal text-[#e8e8e8]">
            Create your first deck to get started!
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateDeck}
          className="relative h-[70px] w-[352px] cursor-pointer rounded-[16px] bg-[#000431]"
        >
          <div className="absolute inset-0 shadow-[0px_5.185px_12.962px_rgba(0,0,0,0.25)]">
            <Image
              src="/assets/deck-builder/web/empty-create-layer1.svg"
              alt=""
              fill
              className="object-fill"
            />
            <Image
              src="/assets/deck-builder/web/empty-create-layer2.svg"
              alt=""
              fill
              className="object-fill"
            />
            <div className="absolute inset-[7.8%_1.46%]">
              <Image
                src="/assets/deck-builder/web/empty-create-layer3.svg"
                alt=""
                fill
                className="object-fill"
              />
            </div>
          </div>
          <span className="absolute inset-0 flex items-center justify-center gap-[8px]">
            <Image
              src="/assets/deck-builder/web/empty-create-icon.svg"
              alt=""
              width={24.701}
              height={24.701}
            />
            <span className="text-[22px] leading-[33px] font-bold text-white">
              Create Deck
            </span>
          </span>
        </button>
      </article>
    </section>
  );
}

function FigmaTopCard() {
  return (
    <section className="relative mx-auto h-[113px] w-full max-w-[375px] overflow-hidden rounded-[9.668px] border-t-2 border-r-2 border-l-2 border-[#ABC3FF] bg-[linear-gradient(0deg,#010B7B_29.2%,#0060DE_123.01%)]">
      <div className="absolute left-[14px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[8.459px] bg-[rgba(206,206,206,0.13)]">
        <Image
          src="/assets/deck-builder/top-deck-icon.svg"
          alt=""
          width={17}
          height={17}
        />
      </div>

      <Image
        src="/assets/deck-builder/top-decor-group23.svg"
        alt=""
        width={105}
        height={93}
        className="pointer-events-none absolute left-[267px] top-[-20px] opacity-95"
      />
      <div className="pointer-events-none absolute left-[236px] top-[-13px] h-[90px] w-[40px] rotate-[76.74deg]">
        <Image
          src="/assets/deck-builder/top-union-1.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div className="pointer-events-none absolute left-[294px] top-[-5px] h-[68px] w-[84px] rotate-[144.13deg]">
        <Image
          src="/assets/deck-builder/top-union-2.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div className="pointer-events-none absolute left-[218px] top-[-18px] h-[41px] w-[31px] rotate-[56.79deg]">
        <Image
          src="/assets/deck-builder/top-union-3.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      <h2 className="absolute left-[14px] top-[52px] text-[18px] leading-[27px] font-bold text-white">
        Deck Builder
      </h2>
      <p className="absolute left-[14px] top-[82px] max-w-[346px] text-[12px] leading-[12.1px] font-light text-[#e8e8e8]">
        Open exclusive packs to unlock legendary cards and skins
      </p>
    </section>
  );
}

function FigmaBottomCard({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <section className="mx-auto mt-6 flex w-full max-w-[375px] flex-col items-center gap-[19px] rounded-[16px] border border-[#8085bd] bg-[linear-gradient(6.08deg,#120c35_11.336%,#143c87_57.519%,#13245e_112.14%)] px-[61px] py-[32px]">
      <div className="flex h-[95.996px] w-[95.996px] items-center justify-center rounded-full bg-[linear-gradient(178.12deg,rgba(20,60,135,0)_32.053%,#020c7b_95.528%)]">
        <Image
          src="/assets/deck-builder/bottom-center-icon.svg"
          alt=""
          width={53}
          height={53}
        />
      </div>

      <div className="text-center">
        <h3 className="text-[18px] leading-[28px] font-bold text-white">
          No decks yet
        </h3>
        <p className="mt-2 text-[14px] leading-[20px] font-normal text-[#e8e8e8]">
          Create your first deck to get started!
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateDeck}
        className="relative h-[46.981px] w-[230.201px] cursor-pointer shadow-[0_5.185px_12.962px_rgba(0,0,0,0.25)]"
      >
        <Image
          src="/assets/deck-builder/create-btn-layer1.svg"
          alt=""
          fill
          className="object-fill"
        />
        <Image
          src="/assets/deck-builder/create-btn-layer2.svg"
          alt=""
          fill
          className="object-fill"
        />
        <div className="absolute inset-[7.8%_1.46%]">
          <Image
            src="/assets/deck-builder/create-btn-layer3.svg"
            alt=""
            fill
            className="object-fill"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-[5px]">
          <Image
            src="/assets/deck-builder/create-icon.svg"
            alt=""
            width={16.905}
            height={16.905}
          />
          <span className="text-[14.102px] leading-[21.937px] font-bold text-white">
            Create Deck
          </span>
        </div>
      </button>
    </section>
  );
}

function FigmaWideCreateButton({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreateDeck}
      className="relative h-[47.246px] w-full cursor-pointer"
    >
      <Image
        src="/assets/deck-builder/v2/create-deck-union.svg"
        alt=""
        width={371.63}
        height={46.981}
        className="pointer-events-none absolute left-[3.37px] top-[0.26px] h-[46.98px] w-[371.63px] max-w-none"
      />
      <Image
        src="/assets/deck-builder/v2/create-deck-frame.svg"
        alt=""
        width={375}
        height={47.111}
        className="pointer-events-none absolute left-0 top-0 h-[47.111px] w-[375px] max-w-none"
      />
      <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
        <Image
          src="/assets/deck-builder/v2/create-deck-icon.svg"
          alt=""
          width={16.905}
          height={16.905}
        />
        <span className="text-[14.102px] leading-[21.937px] font-bold text-white">
          Create Deck
        </span>
      </span>
    </button>
  );
}

function DeckDesktopWideCreateButton({
  onCreateDeck,
}: {
  onCreateDeck: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCreateDeck}
      className="relative h-[54.027px] w-[1257px] cursor-pointer"
    >
      <Image
        src="/assets/deck-builder/web/create-deck-531-union.svg"
        alt=""
        width={1256.998}
        height={53.731}
        className="pointer-events-none absolute left-0 top-[0.3px] h-[53.731px] w-[1256.998px] max-w-none"
      />
      <Image
        src="/assets/deck-builder/web/create-deck-531-frame.svg"
        alt=""
        width={1257}
        height={54.027}
        className="pointer-events-none absolute left-0 top-0 h-[54.027px] w-[1257px] max-w-none"
      />
      <span className="absolute left-1/2 top-1/2 flex h-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[5px] pt-[7px]">
        <Image
          src="/assets/deck-builder/web/create-deck-531-icon.svg"
          alt=""
          width={16.905}
          height={16.905}
        />
        <span className="whitespace-nowrap text-[18px] leading-[27px] font-bold text-white">
          Create Deck
        </span>
      </span>
    </button>
  );
}

function FigmaDeckSeparator() {
  return (
    <div className="relative h-[26px] w-[377px] self-center">
      <div className="absolute inset-[0_47.68%_0_45.95%]">
        <Image
          src="/assets/deck-builder/v2/separator-4432-star.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[16.62%_48.71%_16.62%_47.04%]">
        <Image
          src="/assets/deck-builder/v2/separator-4432-glow.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[44.28%_57.18%_55.72%_0]">
        <div className="absolute inset-[-1.5px_0]">
          <Image
            src="/assets/deck-builder/v2/separator-4432-line-left.svg"
            alt=""
            fill
            className="object-fill"
          />
        </div>
      </div>
      <div className="absolute inset-[44.28%_0_55.72%_54.73%]">
        <div className="absolute inset-[-1.5px_0]">
          <Image
            src="/assets/deck-builder/v2/separator-4432-line-right.svg"
            alt=""
            fill
            className="object-fill"
          />
        </div>
      </div>
    </div>
  );
}

function DeckCopyIcon({
  className = "h-[15.995px] w-[15.995px]",
}: {
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-[33.33%_8.33%_8.33%_33.33%]">
        <Image
          src="/assets/deck-builder/v2/deck-copy-1.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[8.33%_33.33%_33.33%_8.33%]">
        <Image
          src="/assets/deck-builder/v2/deck-copy-2.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
    </div>
  );
}

function DeckDeleteIcon({
  className = "h-[15.995px] w-[15.995px]",
}: {
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-[25%_12.5%_75%_12.5%]">
        <Image
          src="/assets/deck-builder/v2/deck-delete-1.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[25%_20.83%_8.33%_20.83%]">
        <Image
          src="/assets/deck-builder/v2/deck-delete-2.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[8.33%_33.33%_75%_33.33%]">
        <Image
          src="/assets/deck-builder/v2/deck-delete-3.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[45.83%_58.33%_29.17%_41.67%]">
        <Image
          src="/assets/deck-builder/v2/deck-delete-4.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
      <div className="absolute inset-[45.83%_41.67%_29.17%_58.33%]">
        <Image
          src="/assets/deck-builder/v2/deck-delete-4.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>
    </div>
  );
}

function FigmaSavedDeckCard({
  deck,
  onEdit,
  onDelete,
}: {
  deck: SavedDeck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slots = [...normalizeDeckCards(deck.cards)];
  while (slots.length < TOTAL_SLOTS) {
    slots.push(null);
  }
  const visibleSlots = slots.slice(0, TOTAL_SLOTS);
  const filledSlots = visibleSlots.filter(
    (card): card is CardItem => card !== null,
  ).length;
  const savedDeckCompletion = Math.round((filledSlots / TOTAL_SLOTS) * 100);

  return (
    <article className="rounded-[16px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] p-[1.735px]">
      <div className="flex flex-col items-center gap-[11.983px] px-[15.995px] pt-[15.995px] pb-[11.983px]">
        <div className="flex h-[47.957px] w-full items-start justify-between">
          <div className="h-[47.957px] w-[150.08px]">
            <h3 className="text-[18px] leading-[28px] font-bold text-white">
              {deck.name}
            </h3>
            <p className="mt-[6px] whitespace-nowrap text-[14px] leading-[20px] font-normal text-[#d2d2d2]">
              {filledSlots}/{TOTAL_SLOTS} cards &bull; Completion rate{" "}
              {savedDeckCompletion}%
            </p>
          </div>

          <div className="flex h-[31.99px] w-[71.977px] items-start gap-[7.997px]">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-[31.99px] w-[31.99px] items-center justify-center rounded-[10px] bg-[#010b7b]"
              aria-label={`Copy ${deck.name}`}
            >
              <DeckCopyIcon />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-[31.99px] w-[31.99px] items-center justify-center rounded-[10px] bg-[#d00416]"
              aria-label={`Delete ${deck.name}`}
            >
              <DeckDeleteIcon />
            </button>
          </div>
        </div>

        <div className="w-[352px] max-w-full rounded-[10px]">
          <div className="grid grid-cols-4 gap-[8px] px-[6.81px] pt-[7.97px] pb-[7.97px]">
            {visibleSlots.map((card, index) => (
              <div
                key={`${deck.id}-${card?.id ?? "empty"}-${index}`}
                className="relative h-[47.063px] w-[35.297px] overflow-hidden rounded-[4px] border-[0.5px] border-[#b2b2b2] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)]"
              >
                {card ? (
                  <Image
                    src={card.art}
                    alt={card.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="relative h-[47.957px] w-[348.459px] max-w-full"
        >
          <Image
            src="/assets/deck-builder/v2/edit-deck-union.svg"
            alt=""
            width={374.383}
            height={73.881}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[73.881px] w-[374.383px] max-w-none -translate-x-1/2 -translate-y-1/2"
          />
          <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
            <Image
              src="/assets/deck-builder/v2/wallet-icon.svg"
              alt=""
              width={16.905}
              height={16.905}
            />
            <span className="text-[14.102px] leading-[21.937px] font-bold text-white">
              Edit Deck
            </span>
          </span>
        </button>
      </div>
    </article>
  );
}

function FigmaCardTile({
  card,
  onClick,
  countLabel,
  buttonProps,
  isDragging = false,
}: {
  card: CardItem;
  onClick?: () => void;
  countLabel?: number;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}) {
  const meta = CARD_META[card.variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick && !buttonProps}
      {...buttonProps}
      className={`relative h-[118px] w-full overflow-hidden rounded-[12px] shadow-[0px_0.931px_0.931px_0px_rgba(0,0,0,0.25)] ${
        onClick ? "cursor-pointer" : "cursor-default"
      } ${isDragging ? "opacity-40" : ""} ${buttonProps?.className ?? ""}`}
      style={buttonProps?.style}
      aria-label={buttonProps?.["aria-label"] ?? card.name}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`}
      />
      <div className="absolute inset-[6px] overflow-hidden rounded-[10px]">
        <Image
          src={card.art}
          alt={card.name}
          fill
          className="pointer-events-none object-cover"
          unoptimized
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.34)_100%)]" />
      <div className="absolute left-[0.25px] top-[1.4px] h-[102.406px] w-[82.856px] overflow-hidden opacity-0">
        <Image
          src={card.art}
          alt={card.name}
          width={183}
          height={183}
          className={`pointer-events-none absolute max-w-none ${meta.artClass}`}
          unoptimized
        />
      </div>
      <Image
        src={card.frame}
        alt=""
        fill
        className="pointer-events-none object-fill"
      />

      <div className="absolute left-[1.63px] top-[1.4px] h-[11.986px] w-[11.986px]">
        <Image
          src={meta.ellipse}
          alt=""
          fill
          className="pointer-events-none object-fill"
        />
      </div>
      <p
        className={`absolute left-[7.62px] top-[7.39px] -translate-x-1/2 -translate-y-1/2 text-center text-[8.84px] leading-[13.266px] font-bold ${meta.badgeClass}`}
        style={meta.badgeStyle}
      >
        {typeof countLabel === "number" ? countLabel : null}
      </p>

      <div className="absolute left-[76.34px] top-[1.4px] h-[5.469px] w-[5.469px]">
        <Image
          src={meta.element}
          alt=""
          fill
          className="pointer-events-none object-fill"
        />
        <Image
          src={meta.elementIcon}
          alt=""
          fill
          className="pointer-events-none object-fill"
        />
      </div>

      <div className="absolute inset-x-[8px] bottom-[8px] rounded-[8px] bg-black/55 px-2 py-1 text-center">
        <p className="truncate text-[10px] font-bold text-white">{card.name}</p>
      </div>
    </button>
  );
}

function EmptySlotTile({ slotIndex }: { slotIndex: number }) {
  return (
    <div className="bg-gradient-to-b border border-[#afafaf] border-solid p-[1.715px] rounded-[5.932px] from-[#2d3548] to-[#1a1d2e]">
      <div className="flex h-[115.67px] flex-col items-center justify-center gap-[7.907px]">
        <Image
          src="/assets/deck-builder/v2/empty-plus.svg"
          alt=""
          width={31.626}
          height={31.626}
        />
        <span className="text-[11.864px] leading-[15.818px] font-bold text-[#d2d2d2]">
          {getSlotLabel(slotIndex)}
        </span>
      </div>
    </div>
  );
}

function DeckDesktopEmptySlotCard({
  slotIndex,
  withLabel = true,
}: {
  slotIndex: number;
  withLabel?: boolean;
}) {
  return (
    <div className="aspect-[167.18/237.678] w-full rounded-[5.932px] border-[2.014px] border-[#afafaf] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)] p-[3.455px]">
      {withLabel ? (
        <div className="flex h-full flex-col items-center justify-center gap-[15.925px]">
          <Image
            src="/assets/deck-builder/v2/empty-plus.svg"
            alt=""
            width={40}
            height={40}
          />
          <span className="px-2 text-center text-[15px] leading-[20px] font-bold text-[#d2d2d2]">
            {getSlotLabel(slotIndex)}
          </span>
        </div>
      ) : (
        <div className="h-full" />
      )}
    </div>
  );
}

function DeckDesktopDeckSlotCard({
  card,
  slotIndex,
  onInspect,
  buttonProps,
  isDragging = false,
}: {
  card: CardItem | null;
  slotIndex: number;
  onInspect?: () => void;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}) {
  if (!card) {
    return <DeckDesktopEmptySlotCard slotIndex={slotIndex} withLabel />;
  }

  return (
    <button
      type="button"
      onClick={onInspect}
      {...buttonProps}
      className={`relative aspect-[167.18/237.678] w-full overflow-hidden rounded-[5.932px] border-[2.014px] border-[#afafaf] bg-gradient-to-br ${card.gradient} ${
        isDragging ? "opacity-40" : ""
      } ${buttonProps?.className ?? ""}`}
      style={buttonProps?.style}
      aria-label={buttonProps?.["aria-label"] ?? card.name}
    >
      <Image
        src={card.art}
        alt={card.name}
        width={167}
        height={238}
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        unoptimized
      />
      <div className="absolute inset-x-[8px] bottom-[8px] rounded-[8px] bg-black/45 px-2 py-1 text-center">
        <p className="text-[11px] font-bold text-white">{card.name}</p>
      </div>
    </button>
  );
}

function DeckDesktopAvailableCard({
  card,
  onAdd,
  countLabel,
  buttonProps,
  isDragging = false,
}: {
  card: CardItem | null;
  onAdd?: () => void;
  countLabel?: number;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}) {
  if (!card) {
    return (
      <div className="aspect-[142.084/201.999] w-full rounded-[12px] border border-[#afafaf] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)] p-[1.715px]">
        <div className="h-[115.67px]" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      {...buttonProps}
      className={`group relative aspect-[142.084/201.999] w-full overflow-hidden rounded-[12px] bg-gradient-to-br ${card.gradient} shadow-[0px_0.931px_0.931px_rgba(0,0,0,0.25)] ${
        isDragging ? "opacity-40" : ""
      } ${buttonProps?.className ?? ""}`}
      style={buttonProps?.style}
      aria-label={buttonProps?.["aria-label"] ?? card.name}
    >
      <Image
        src={card.art}
        alt={card.name}
        width={142}
        height={202}
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        unoptimized
      />
      {typeof countLabel === "number" ? (
        <div className="absolute left-[8px] top-[8px] min-w-[28px] rounded-full bg-black/65 px-2 py-1 text-center text-[10px] font-bold text-white">
          {countLabel}
        </div>
      ) : null}
      <div className="absolute inset-x-[6px] bottom-[6px] rounded-[8px] bg-black/50 px-2 py-1 text-center">
        <p className="text-[9px] font-bold text-white">{card.name}</p>
      </div>
    </button>
  );
}

function AvailableGridPlaceholder({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="h-[118px] rounded-[12px] border border-white/8 bg-white/[0.03]" />
    );
  }

  return (
    <div className="aspect-[142.084/201.999] w-full rounded-[12px] border border-white/8 bg-white/[0.03]" />
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

function MobileDetailBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="fixed left-4 top-[84px] z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#151932]/85 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
      aria-label="Back"
    >
      <BackIcon />
    </button>
  );
}

type AvailableCardsEmptyMode = "wallet" | "inventory" | "used" | "filtered";

function AvailableCardsEmptyState({
  mode,
  onConnect,
}: {
  mode: AvailableCardsEmptyMode;
  onConnect: () => void;
}) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-[12px] border border-dashed border-white/15 bg-black/10 px-4 py-6 text-center">
      <p className="text-sm font-semibold text-white">
        {mode === "wallet"
          ? "Connect a wallet to load your inventory"
          : mode === "inventory"
            ? "No cards in inventory"
            : mode === "used"
              ? "All owned cards are already in this deck"
              : "No cards match your search"}
      </p>
      <p className="mt-2 max-w-[320px] text-xs text-white/60">
        {mode === "wallet"
          ? "The deck builder now uses your inventory as the only source of available cards."
          : mode === "inventory"
            ? "Open packs or import inventory cards first. Only owned cards can be added to a deck."
            : mode === "used"
              ? "Remove a card from the deck to make that inventory copy available again."
              : "Try clearing the search box or resetting the active filters."}
      </p>
      {mode === "wallet" && (
        <button
          type="button"
          onClick={onConnect}
          className="mt-4 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

function MobileAvailableInventoryCard({
  card,
  remainingCount,
  onAdd,
  onInspect,
  isShaking = false,
}: {
  card: CardItem;
  remainingCount: number;
  onAdd: () => void;
  onInspect: () => void;
  isShaking?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: getAvailableCardDragId(card.id),
      data: {
        type: "available-card",
        card,
      } satisfies DragData,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`relative ${isShaking ? "deck-builder-card-shake" : ""}`}>
        <FigmaCardTile
          card={card}
          countLabel={remainingCount}
          onClick={onInspect}
          buttonProps={{
            ...attributes,
            ...listeners,
            className: "cursor-grab active:cursor-grabbing touch-none",
            "aria-label": `View ${card.name}`,
          }}
          isDragging={isDragging}
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className="absolute right-[6px] top-[6px] z-10 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#010b7b]/90 text-[16px] font-bold text-white shadow-lg"
          aria-label={`Add ${card.name} to deck`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function MobileDeckSlot({
  slotIndex,
  card,
  onRemove,
  onInspect,
}: {
  slotIndex: number;
  card: CardItem | null;
  onRemove: () => void;
  onInspect: (card: CardItem) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getDeckSlotDropId(slotIndex),
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: getDeckCardDragId(slotIndex),
    data: card
      ? ({
          type: "deck-card",
          card,
          slotIndex,
        } satisfies DragData)
      : undefined,
    disabled: card === null,
  });

  if (!card) {
    return (
      <div
        ref={setNodeRef}
        className={isOver ? "rounded-[12px] ring-2 ring-[#6ea8ff]" : undefined}
      >
        <EmptySlotTile slotIndex={slotIndex} />
      </div>
    );
  }

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? "rounded-[12px] ring-2 ring-[#6ea8ff]" : ""}`}
    >
      <div ref={setDragRef} style={style}>
        <FigmaCardTile
          card={card}
          onClick={() => onInspect(card)}
          buttonProps={{
            ...attributes,
            ...listeners,
            className: "cursor-grab active:cursor-grabbing touch-none",
            "aria-label": `View ${card.name}`,
          }}
          isDragging={isDragging}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-[6px] top-[6px] z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white"
        aria-label={`Remove ${card.name} from deck`}
      >
        X
      </button>
    </div>
  );
}

function DesktopAvailableInventoryCard({
  card,
  remainingCount,
  onAdd,
  onInspect,
  isShaking = false,
}: {
  card: CardItem;
  remainingCount: number;
  onAdd: () => void;
  onInspect: () => void;
  isShaking?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: getAvailableCardDragId(card.id),
      data: {
        type: "available-card",
        card,
      } satisfies DragData,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`relative ${isShaking ? "deck-builder-card-shake" : ""}`}>
        <DeckDesktopAvailableCard
          card={card}
          countLabel={remainingCount}
          onAdd={onInspect}
          buttonProps={{
            ...attributes,
            ...listeners,
            className: "cursor-grab active:cursor-grabbing touch-none",
            "aria-label": `View ${card.name}`,
          }}
          isDragging={isDragging}
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className="absolute right-[8px] top-[8px] z-10 flex h-[28px] min-w-[28px] items-center justify-center rounded-full bg-[#010b7b]/90 px-2 text-[18px] font-bold text-white shadow-lg"
          aria-label={`Add ${card.name} to deck`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function DeckBuilderFilterModal({
  rarity,
  setRarity,
  zone,
  setZone,
  onClose,
  onReset,
  onApply,
}: {
  rarity: "all" | OwnedCard["rarity"];
  setRarity: (value: "all" | OwnedCard["rarity"]) => void;
  zone: "all" | CardZone;
  setZone: (value: "all" | CardZone) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const activeCount = (rarity === "all" ? 0 : 1) + (zone === "all" ? 0 : 1);

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
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Zone</p>
            <div className="flex flex-wrap gap-3">
              {ZONE_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setZone(tab.id)}
                  className={`h-[40px] rounded-[6px] px-[16px] text-[16.075px] font-bold text-white ${zone === tab.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)]" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)]"}`}
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

function getCardDetailTraits(card: CardItem) {
  if (card.traits.length > 0) {
    return card.traits;
  }

  return [card.faction, card.zone].filter((value): value is string =>
    Boolean(value),
  );
}

function DeckBuilderMobileCardDetail({ card }: { card: CardItem }) {
  const rarityMeta: Record<
    OwnedCard["rarity"],
    {
      detailLabel: string;
      tagBg: string;
    }
  > = {
    Common: {
      detailLabel: "Common",
      tagBg: "bg-[#616161]",
    },
    Rare: {
      detailLabel: "Rare",
      tagBg: "bg-[#1fc16b]",
    },
    Legendary: {
      detailLabel: "Legendary",
      tagBg: "bg-[#dfb400]",
    },
    Mythic: {
      detailLabel: "Mythic",
      tagBg:
        "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)]",
    },
  };
  const meta = rarityMeta[card.rarity];
  const detailTraits = getCardDetailTraits(card);

  return (
    <section className="mx-auto w-full max-w-[375px] space-y-5 pb-8">
      <div className="flex justify-center">
        <div className="relative h-[507px] w-full max-w-[360px] overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
          <Image
            src={card.art}
            alt={card.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[365px] flex-col items-center gap-5 px-[15.995px]">
        <div className="mt-1 flex w-full max-w-[348px] items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] leading-[28px] font-bold text-white">
              {card.name}
            </p>
            {card.subtitle ? (
              <p className="text-[14px] leading-[20px] font-normal text-[#e8e8e8]">
                {card.subtitle}
              </p>
            ) : null}
          </div>
          <span
            className={`ml-2 mt-0.5 inline-flex h-[26px] min-w-[72px] shrink-0 items-center justify-center rounded-full px-3 text-[12px] leading-[17px] font-bold text-white ${meta.tagBg}`}
          >
            {meta.detailLabel}
          </span>
        </div>

        <div className="w-full max-w-[348px] space-y-1">
          <p className="text-[12px] leading-[16px] text-[#e8e8e8]">Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {detailTraits.map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[361px] rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
          <p className="text-[12px] leading-[24px] font-bold text-white">
            Description
          </p>
          {card.abilityDescription ? (
            <p className="mt-2 text-[13px] leading-[22px] font-normal text-[#99a1af]">
              {card.abilityDescription}
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-[22px] font-normal text-[#99a1af]">
              No description available for this card.
            </p>
          )}
          {card.leaderEligible && card.leaderDescription ? (
            <p className="mt-4 text-[13px] leading-[22px] font-normal text-[#99a1af]">
              {card.leaderDescription}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DeckBuilderCardModal({
  card,
  onClose,
}: {
  card: CardItem;
  onClose: () => void;
}) {
  const rarityMeta: Record<
    OwnedCard["rarity"],
    {
      detailLabel: string;
      tagBg: string;
    }
  > = {
    Common: {
      detailLabel: "Common",
      tagBg: "bg-[#616161]",
    },
    Rare: {
      detailLabel: "Rare",
      tagBg: "bg-[#1fc16b]",
    },
    Legendary: {
      detailLabel: "Legendary",
      tagBg: "bg-[#dfb400]",
    },
    Mythic: {
      detailLabel: "Mythic",
      tagBg:
        "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)]",
    },
  };
  const meta = rarityMeta[card.rarity];
  const detailTraits = getCardDetailTraits(card);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="grid gap-6 md:grid-cols-[360px_1fr] md:gap-8">
          <div className="relative h-[380px] w-full overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)] md:h-[507px] md:max-w-[360px]">
            <Image
              src={card.art}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[26px] leading-[39px] font-bold text-white">
                  {card.name}
                </h2>
                {card.subtitle ? (
                  <p className="mt-1 text-[14px] leading-[20px] text-[#99a1af]">
                    {card.subtitle}
                  </p>
                ) : null}
              </div>
              <span
                className={`mt-2 inline-flex h-[26px] min-w-[92px] items-center justify-center rounded-full px-4 text-[12.936px] font-bold text-white ${meta.tagBg}`}
              >
                {meta.detailLabel}
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <p className="text-[14px] text-[#99a1af]">Traits</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {detailTraits.map((trait) => (
                  <span
                    key={trait}
                    className="inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[12px] font-medium text-white"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex-1 rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
              <p className="text-[16px] leading-[24px] font-bold text-white">
                Description
              </p>
              {card.abilityDescription ? (
                <p className="mt-3 text-[14px] leading-[22.75px] text-[#99a1af]">
                  {card.abilityDescription}
                </p>
              ) : (
                <p className="mt-3 text-[14px] leading-[22.75px] text-[#99a1af]">
                  No description available for this card.
                </p>
              )}
              {card.leaderEligible && card.leaderDescription ? (
                <p className="mt-4 text-[14px] leading-[22.75px] text-[#99a1af]">
                  {card.leaderDescription}
                </p>
              ) : null}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckBuilderLeaderRequiredModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/60 p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[520px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="pr-10">
          <p className="text-[14px] font-bold tracking-[0.14em] text-[#6ea8ff] uppercase">
            Leader Required
          </p>
          <h2 className="mt-3 text-[24px] leading-[32px] font-bold text-white">
            Add a leader before saving this deck.
          </h2>
          <p className="mt-3 text-[15px] leading-[24px] text-[#99a1af]">
            Slot 1 is the Leader slot. Put a leader-eligible card there before
            you save.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)] text-[14px] font-bold text-white"
        >
          Continue Editing
        </button>
      </div>
    </div>
  );
}

function DeckBuilderDeleteDeckModal({
  deckName,
  onClose,
  onConfirm,
}: {
  deckName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/60 p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[520px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="pr-10">
          <p className="text-[14px] font-bold tracking-[0.14em] text-[#f87171] uppercase">
            Delete Deck
          </p>
          <h2 className="mt-3 text-[24px] leading-[32px] font-bold text-white">
            Delete {deckName}?
          </h2>
          <p className="mt-3 text-[15px] leading-[24px] text-[#99a1af]">
            This removes the deck from local saved decks for this wallet. This
            action cannot be undone.
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[48px] flex-1 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-[14px] font-bold text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-[48px] flex-1 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#d00416_0%,#8b1021_100%)] text-[14px] font-bold text-white"
          >
            Delete Deck
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopDeckSlot({
  slotIndex,
  card,
  onRemove,
  onInspect,
}: {
  slotIndex: number;
  card: CardItem | null;
  onRemove: () => void;
  onInspect: (card: CardItem) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getDeckSlotDropId(slotIndex),
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: getDeckCardDragId(slotIndex),
    data: card
      ? ({
          type: "deck-card",
          card,
          slotIndex,
        } satisfies DragData)
      : undefined,
    disabled: card === null,
  });

  if (!card) {
    return (
      <div
        ref={setNodeRef}
        className={isOver ? "rounded-[6px] ring-2 ring-[#6ea8ff]" : undefined}
      >
        <DeckDesktopDeckSlotCard card={null} slotIndex={slotIndex} />
      </div>
    );
  }

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? "rounded-[6px] ring-2 ring-[#6ea8ff]" : ""}`}
    >
      <div ref={setDragRef} style={style}>
        <DeckDesktopDeckSlotCard
          card={card}
          slotIndex={slotIndex}
          onInspect={() => onInspect(card)}
          buttonProps={{
            ...attributes,
            ...listeners,
            className: "cursor-grab active:cursor-grabbing touch-none",
            "aria-label": `View ${card.name}`,
          }}
          isDragging={isDragging}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-[8px] top-[8px] z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white"
        aria-label={`Remove ${card.name} from deck`}
      >
        Remove
      </button>
    </div>
  );
}

function DragCardOverlay({ card }: { card: CardItem }) {
  return (
    <div
      className={`relative h-[180px] w-[128px] overflow-hidden rounded-[12px] bg-gradient-to-br ${card.gradient} shadow-2xl`}
    >
      <Image
        src={card.art}
        alt={card.name}
        fill
        className="object-cover opacity-90"
        unoptimized
      />
      <div className="absolute left-[8px] top-[8px] rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
        Dragging
      </div>
      <div className="absolute inset-x-[8px] bottom-[8px] rounded-[8px] bg-black/60 px-2 py-1 text-center">
        <p className="truncate text-[11px] font-bold text-white">{card.name}</p>
      </div>
    </div>
  );
}

function DroppableSection({
  id,
  className,
  activeClassName,
  children,
}: {
  id: string;
  className: string;
  activeClassName: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? activeClassName : ""}`}
    >
      {children}
    </div>
  );
}

function DeckDesktopSavedCardTile({ card }: { card: CardItem | null }) {
  if (!card) {
    return (
      <div className="relative aspect-[144.989/204.193] w-full overflow-hidden rounded-[12px] border border-[#b2b2b2] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)]" />
    );
  }

  return (
    <div className="relative aspect-[144.989/204.193] w-full overflow-hidden rounded-[12px]">
      <Image
        src={card.art}
        alt={card.name}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

function DeckDesktopSavedDeckCard({
  deck,
  onEdit,
  onDelete,
}: {
  deck: SavedDeck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slots = [...normalizeDeckCards(deck.cards)];
  while (slots.length < TOTAL_SLOTS) {
    slots.push(null);
  }
  const visibleSlots = slots.slice(0, TOTAL_SLOTS);
  const filledSlots = visibleSlots.filter(
    (card): card is CardItem => card !== null,
  ).length;
  const savedDeckCompletion = Math.round((filledSlots / TOTAL_SLOTS) * 100);

  return (
    <article className="w-full rounded-[16px] border border-[#3a3e4f] bg-[linear-gradient(180deg,#2a2e3f_0%,#1e2230_100%)] p-[24px]">
      <div className="flex h-[69px] items-start justify-between">
        <div className="h-[44px] w-[166px]">
          <h3 className="text-[32px] leading-[48px] font-bold text-white">
            {deck.name}
          </h3>
          <p className="whitespace-nowrap text-[22px] leading-[33px] font-bold text-[#9ca3af]">
            {filledSlots}/{TOTAL_SLOTS} cards &bull; Completion rate{" "}
            {savedDeckCompletion}%
          </p>
        </div>

        <div className="flex h-[53px] w-[119.25px] items-start gap-[13.25px]">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-[53px] w-[53px] items-center justify-center rounded-[16.563px] bg-[#1e3a8a]"
            aria-label={`Copy ${deck.name}`}
          >
            <DeckCopyIcon className="h-[26.5px] w-[26.5px]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-[53px] w-[53px] items-center justify-center rounded-[16.563px] bg-[#7f1d1d]"
            aria-label={`Delete ${deck.name}`}
          >
            <DeckDeleteIcon className="h-[26.5px] w-[26.5px]" />
          </button>
        </div>
      </div>

      <div className="mt-[32px] grid grid-cols-4 gap-[8.086px]">
        {visibleSlots.map((card, index) => (
          <DeckDesktopSavedCardTile
            key={`desktop-saved-card-${deck.id}-${index}-${card?.id ?? "empty"}`}
            card={card}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="relative mt-[32px] h-[48px] w-full"
      >
        <Image
          src="/assets/deck-builder/web/edit-deck-union-514.svg"
          alt=""
          fill
          className="pointer-events-none object-fill"
        />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] leading-[27px] font-bold text-white">
          Edit Deck
        </span>
      </button>
    </article>
  );
}

type DeckBuilderScreenProps = {
  wallet: ReturnType<typeof useWallet>["wallet"];
  openPicker: ReturnType<typeof useWallet>["openPicker"];
};

function DeckBuilderScreen({ wallet, openPicker }: DeckBuilderScreenProps) {
  const { ownedCards } = useInventory(wallet?.address ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [deckName, setDeckName] = useState("My Deck");
  const [deckSlots, setDeckSlots] =
    useState<Array<CardItem | null>>(emptySlots);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(
    () => loadPersistedDeckState(wallet?.address ?? null).savedDecks,
  );
  const [nextDeckId, setNextDeckId] = useState(
    () => loadPersistedDeckState(wallet?.address ?? null).nextDeckId,
  );
  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardItem | null>(null);
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<SavedDeck | null>(
    null,
  );
  const [showLeaderRequiredModal, setShowLeaderRequiredModal] = useState(false);
  const [shakingCardId, setShakingCardId] = useState<number | null>(null);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [desktopRarity, setDesktopRarity] = useState<
    "all" | OwnedCard["rarity"]
  >("all");
  const [desktopZone, setDesktopZone] = useState<"all" | CardZone>("all");
  const [draftRarity, setDraftRarity] = useState<"all" | OwnedCard["rarity"]>(
    "all",
  );
  const [draftZone, setDraftZone] = useState<"all" | CardZone>("all");
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const inventoryCards = useMemo(
    () => sortInventoryCards(ownedCards.map(mapOwnedCardToCardItem)),
    [ownedCards],
  );
  const ownedCountById = useMemo(
    () =>
      new Map(inventoryCards.map((card) => [card.id, card.ownedCount ?? 0])),
    [inventoryCards],
  );
  const deckCountById = useMemo(() => buildCountMap(deckSlots), [deckSlots]);
  const remainingCountById = useMemo(() => {
    const counts = new Map<number, number>();
    for (const card of inventoryCards) {
      const ownedCount = ownedCountById.get(card.id) ?? 0;
      const usedCount = deckCountById.get(card.id) ?? 0;
      counts.set(card.id, Math.max(ownedCount - usedCount, 0));
    }
    return counts;
  }, [deckCountById, inventoryCards, ownedCountById]);
  const remainingInventoryCards = useMemo(
    () =>
      inventoryCards.filter(
        (card) =>
          !deckCountById.has(card.id) && (ownedCountById.get(card.id) ?? 0) > 0,
      ),
    [deckCountById, inventoryCards, ownedCountById],
  );
  const desktopVisibleInventoryCards = useMemo(() => {
    const q = desktopSearch.trim().toLowerCase();

    return remainingInventoryCards.filter(
      (card) =>
        (desktopRarity === "all" || card.rarity === desktopRarity) &&
        (desktopZone === "all" || card.zone === desktopZone) &&
        (q.length === 0 ||
          card.name.toLowerCase().includes(q) ||
          card.faction.toLowerCase().includes(q) ||
          (card.zone ?? "").toLowerCase().includes(q)),
    );
  }, [desktopRarity, desktopSearch, desktopZone, remainingInventoryCards]);
  const availableCardGrid = useMemo(
    () => padGrid(remainingInventoryCards, 4),
    [remainingInventoryCards],
  );
  const desktopAvailableCardGrid = useMemo(
    () => padGrid(desktopVisibleInventoryCards, 4),
    [desktopVisibleInventoryCards],
  );

  const selectedCards = useMemo(
    () => deckSlots.filter((slot): slot is CardItem => slot !== null),
    [deckSlots],
  );

  const completionRate = Math.round((selectedCards.length / TOTAL_SLOTS) * 100);
  const showFigmaEmptyState = !isEditing && savedDecks.length === 0;
  const showDesktopSavedState = !isEditing && savedDecks.length > 0;
  const hideMobileLayoutOnDesktop =
    showFigmaEmptyState || isEditing || showDesktopSavedState;

  const startNewDeck = () => {
    setDeckName(`Deck ${savedDecks.length + 1}`);
    setDeckSlots(emptySlots());
    setEditingDeckId(null);
    setIsEditing(true);
  };

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  const triggerCardShake = (cardId: number) => {
    setShakingCardId(cardId);

    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current);
    }

    shakeTimeoutRef.current = window.setTimeout(() => {
      setShakingCardId((current) => (current === cardId ? null : current));
      shakeTimeoutRef.current = null;
    }, 360);
  };

  const handleQuickAdd = (card: CardItem) => {
    const ownedCount = ownedCountById.get(card.id) ?? 0;
    const alreadyInDeck = deckSlots.some((slot) => slot?.id === card.id);
    const nextEmptyIndex = findCompatibleEmptySlot(deckSlots, card);

    if (ownedCount < 1 || alreadyInDeck || nextEmptyIndex < 0) {
      triggerCardShake(card.id);
      return;
    }

    addCardToDeck(card);
  };

  const addCardToDeck = (card: CardItem, preferredSlotIndex?: number) => {
    setDeckSlots((prev) => {
      const ownedCount = ownedCountById.get(card.id) ?? 0;
      const alreadyInDeck = prev.some((slot) => slot?.id === card.id);
      if (ownedCount < 1 || alreadyInDeck) {
        return prev;
      }

      const next = [...prev];
      if (typeof preferredSlotIndex === "number") {
        if (!canCardOccupySlot(card, preferredSlotIndex)) {
          return prev;
        }

        if (next[preferredSlotIndex] === null) {
          next[preferredSlotIndex] = card;
          return next;
        }

        const displacedCard = next[preferredSlotIndex];
        if (!displacedCard) {
          return prev;
        }

        const nextEmptyIndex = findCompatibleEmptySlot(
          next,
          displacedCard,
          preferredSlotIndex,
        );
        if (nextEmptyIndex < 0) {
          return prev;
        }

        next[nextEmptyIndex] = displacedCard;
        next[preferredSlotIndex] = card;
        return next;
      }

      const nextEmptyIndex = findCompatibleEmptySlot(next, card);
      if (nextEmptyIndex < 0) {
        return prev;
      }

      next[nextEmptyIndex] = card;
      return next;
    });
  };

  const removeCardFromDeck = (slotIndex: number) => {
    setDeckSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const clearCurrentDeck = () => {
    setDeckSlots(emptySlots());
  };

  const moveDeckCard = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setDeckSlots((prev) => {
      const next = [...prev];
      const source = next[fromIndex];
      if (!source || !canCardOccupySlot(source, toIndex)) {
        return prev;
      }

      const target = next[toIndex];
      if (target && !canCardOccupySlot(target, fromIndex)) {
        return prev;
      }

      next[toIndex] = source;
      next[fromIndex] = target;
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const dragData = event.active.data.current as DragData | undefined;
    setActiveDrag(dragData ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const dragData = event.active.data.current as DragData | undefined;
    const overId = event.over ? String(event.over.id) : null;
    setActiveDrag(null);

    if (!dragData || !overId) {
      return;
    }

    const overSlotIndex = parseDeckSlotDropId(overId);

    if (dragData.type === "available-card") {
      if (overId === DECK_LIST_DROP_ID) {
        addCardToDeck(dragData.card);
        return;
      }

      if (overSlotIndex !== null) {
        addCardToDeck(dragData.card, overSlotIndex);
      }
      return;
    }

    if (dragData.type === "deck-card") {
      if (overId === AVAILABLE_LIST_DROP_ID) {
        removeCardFromDeck(dragData.slotIndex);
        return;
      }

      if (overSlotIndex !== null) {
        moveDeckCard(dragData.slotIndex, overSlotIndex);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  const openDesktopFilters = () => {
    setDraftRarity(desktopRarity);
    setDraftZone(desktopZone);
    setDesktopFilterOpen(true);
  };

  const saveDeck = () => {
    const trimmedName = deckName.trim();
    const resolvedName =
      trimmedName.length > 0 ? trimmedName : `Deck ${nextDeckId}`;
    const normalizedDeckSlots = normalizeDeckCards(deckSlots);

    if (normalizedDeckSlots[0] === null) {
      setShowLeaderRequiredModal(true);
      return;
    }

    if (editingDeckId !== null) {
      const nextSavedDecks = savedDecks.map((deck) =>
        deck.id === editingDeckId
          ? { ...deck, name: resolvedName, cards: [...normalizedDeckSlots] }
          : deck,
      );
      setSavedDecks(nextSavedDecks);
      persistDeckState(wallet?.address ?? null, {
        nextDeckId,
        savedDecks: nextSavedDecks,
      });
    } else {
      const nextSavedDecks = [
        ...savedDecks,
        { id: nextDeckId, name: resolvedName, cards: [...normalizedDeckSlots] },
      ];
      const upcomingDeckId = nextDeckId + 1;
      setSavedDecks(nextSavedDecks);
      setNextDeckId(upcomingDeckId);
      persistDeckState(wallet?.address ?? null, {
        nextDeckId: upcomingDeckId,
        savedDecks: nextSavedDecks,
      });
    }

    setIsEditing(false);
    setEditingDeckId(null);
    setDeckSlots(emptySlots());
  };

  const editDeck = (deck: SavedDeck) => {
    setDeckName(deck.name);
    setDeckSlots([...normalizeDeckCards(deck.cards)]);
    setEditingDeckId(deck.id);
    setIsEditing(true);
  };

  const requestDeleteDeck = (deck: SavedDeck) => {
    setPendingDeleteDeck(deck);
  };

  const deleteDeck = (deckId: number) => {
    const nextSavedDecks = savedDecks.filter((deck) => deck.id !== deckId);
    setSavedDecks(nextSavedDecks);
    persistDeckState(wallet?.address ?? null, {
      nextDeckId,
      savedDecks: nextSavedDecks,
    });
  };

  const confirmDeleteDeck = () => {
    if (!pendingDeleteDeck) {
      return;
    }

    deleteDeck(pendingDeleteDeck.id);
    setPendingDeleteDeck(null);
  };

  return (
    <PageBackground>
      <main
        className={`relative min-h-screen w-full overflow-hidden bg-transparent pb-28 pt-24 text-white md:pb-0 ${
          hideMobileLayoutOnDesktop ? "md:pt-0" : "md:pt-24"
        }`}
      >
        {showFigmaEmptyState && (
          <section className="relative hidden min-h-screen md:block">
            <DeckDesktopEmptyState onCreateDeck={startNewDeck} />
          </section>
        )}

        {isEditing && (
          <section className="relative hidden min-h-screen md:block">
            <div className="relative z-10 mx-auto w-full max-w-[1257px] pb-20 pt-[132.667px]">
              <div className="flex w-full flex-col items-center">
                <div className="w-full text-center">
                  <h1 className="text-[68px] leading-[102px] font-bold text-white">
                    Deck Builder
                  </h1>
                  <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
                    Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris
                    penatibus varius sagittis mi diam eget penatibus. Ut
                    praesent ut auctor turpis cursus id.
                  </p>
                </div>
                <Image
                  src="/assets/deck-builder/web/hero-wing-separator-401.svg"
                  alt=""
                  width={1257}
                  height={74.86}
                  className="mt-[52px] h-[74.86px] w-[1257px] mix-blend-plus-lighter"
                />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <section className="mt-[52.86px]">
                  <div className="h-[84px] rounded-[12px] bg-[#1a1d2e] px-[15.995px] pt-[15.995px]">
                    <div className="flex h-[55px] items-center justify-between rounded-[10px] border-2 border-[#8c8c8c] bg-[#1a1d2e] px-[24px] py-[8px]">
                      <input
                        id="desktopDeckName"
                        value={deckName}
                        onChange={(event) => setDeckName(event.target.value)}
                        className="w-full bg-transparent text-[22px] leading-[33px] font-bold text-[#e8e8e8] outline-none"
                        placeholder="My Deck"
                      />
                      <button
                        type="button"
                        className="relative h-[20px] w-[20px]"
                        aria-label="Edit deck name"
                      >
                        <Image
                          src="/assets/deck-builder/web/input-edit-icon-web.svg"
                          alt=""
                          fill
                          className="object-fill"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-[24px] flex gap-[39px]">
                    <DroppableSection
                      id={DECK_LIST_DROP_ID}
                      className="w-[526px] rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[12px] py-[16px]"
                      activeClassName="ring-2 ring-[#6ea8ff]"
                    >
                      <div className="mb-[24px] flex h-[35.975px] items-center justify-between">
                        <h2 className="text-[22px] leading-[33px] font-bold text-white">
                          Your Deck
                        </h2>
                        <button
                          type="button"
                          onClick={clearCurrentDeck}
                          className="relative h-[35.975px] w-[77.317px] rounded-[10px] bg-[#d00416]"
                        >
                          <Image
                            src="/assets/deck-builder/v2/clear-icon.svg"
                            alt=""
                            width={15.995}
                            height={15.995}
                            className="absolute left-[11.98px] top-[9.98px]"
                          />
                          <span className="absolute left-[49.46px] top-[7px] -translate-x-1/2 text-[14px] leading-[20px] font-bold text-white">
                            Clear
                          </span>
                        </button>
                      </div>

                      <div className="mb-[24px] rounded-[10px] bg-[#1a1d2e] px-[11.983px] pt-[11.983px] pb-[11.983px]">
                        <div className="grid grid-cols-3 gap-x-[12px] text-center">
                          <div>
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              Total Cards
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {selectedCards.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              [Deck Stats]
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {selectedCards.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              Completion
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {completionRate}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-x-[12.085px] gap-y-[16px]">
                        {deckSlots.map((slot, index) => (
                          <DesktopDeckSlot
                            key={`desktop-slot-${index}-${slot?.id ?? "empty"}`}
                            slotIndex={index}
                            card={slot}
                            onRemove={() => removeCardFromDeck(index)}
                            onInspect={setInspectedCard}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={saveDeck}
                        className="relative mt-[24px] h-[47.957px] w-full"
                      >
                        <Image
                          src="/assets/deck-builder/web/save-deck-union-web.svg"
                          alt=""
                          fill
                          className="object-fill"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[14.102px] leading-[21.937px] font-bold text-white">
                          Save Deck
                        </span>
                      </button>
                    </DroppableSection>

                    <DroppableSection
                      id={AVAILABLE_LIST_DROP_ID}
                      className="min-w-0 flex-1 rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[24px] pt-[24px] pb-[16px]"
                      activeClassName="ring-2 ring-[#6ea8ff]"
                    >
                      <h2 className="text-[22px] leading-[33px] font-bold text-white">
                        Available Cards
                      </h2>
                      <div className="mt-[16px] flex items-center gap-4">
                        <label className="relative flex h-[57px] flex-1 items-center rounded-[10px] border border-[#1f2540] bg-[#151932] pl-12 pr-4">
                          <span className="pointer-events-none absolute left-4">
                            <SearchIcon />
                          </span>
                          <input
                            value={desktopSearch}
                            onChange={(event) =>
                              setDesktopSearch(event.target.value)
                            }
                            placeholder="Search cards..."
                            className="w-full bg-transparent text-[18px] text-white placeholder:text-[#99a1af] outline-none"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={openDesktopFilters}
                          className="flex h-[57px] w-[121px] items-center justify-center gap-2 rounded-[10px] border border-[#1f2540] bg-[#151932] text-[18px] text-white"
                        >
                          <FilterIcon />
                          Filters
                        </button>
                      </div>
                      {desktopAvailableCardGrid.length === 0 ? (
                        <div className="mt-[24px]">
                          <AvailableCardsEmptyState
                            mode={
                              !wallet
                                ? "wallet"
                                : inventoryCards.length === 0
                                  ? "inventory"
                                  : remainingInventoryCards.length === 0
                                    ? "used"
                                    : "filtered"
                            }
                            onConnect={openPicker}
                          />
                        </div>
                      ) : (
                        <div className="mt-[24px] grid grid-cols-4 gap-x-[20.542px] gap-y-[20.542px]">
                          {desktopAvailableCardGrid.map((card, index) =>
                            card ? (
                              <DesktopAvailableInventoryCard
                                key={`desktop-available-${card.id}`}
                                card={card}
                                remainingCount={
                                  remainingCountById.get(card.id) ?? 0
                                }
                                onAdd={() => handleQuickAdd(card)}
                                onInspect={() => setInspectedCard(card)}
                                isShaking={shakingCardId === card.id}
                              />
                            ) : (
                              <AvailableGridPlaceholder
                                key={`desktop-available-empty-${index}`}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </DroppableSection>
                  </div>
                </section>
                <DragOverlay>
                  {activeDrag?.card ? (
                    <DragCardOverlay card={activeDrag.card} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </section>
        )}

        {showDesktopSavedState && (
          <section className="relative hidden min-h-screen md:block">
            <div className="relative z-10 mx-auto w-full max-w-[1257px] pb-20 pt-[132.667px]">
              <div className="flex w-full flex-col items-center">
                <div className="w-full text-center">
                  <h1 className="text-[68px] leading-[102px] font-bold text-white">
                    Deck Builder
                  </h1>
                  <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
                    Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris
                    penatibus varius sagittis mi diam eget penatibus. Ut
                    praesent ut auctor turpis cursus id.
                  </p>
                </div>
                <Image
                  src="/assets/deck-builder/web/hero-wing-separator-401.svg"
                  alt=""
                  width={1257}
                  height={74.86}
                  className="mt-[52px] h-[74.86px] w-[1257px] mix-blend-plus-lighter"
                />
              </div>

              <section className="mt-[60px] space-y-[20px]">
                <DeckDesktopWideCreateButton onCreateDeck={startNewDeck} />
                {savedDecks.map((deck) => (
                  <DeckDesktopSavedDeckCard
                    key={`desktop-saved-deck-${deck.id}`}
                    deck={deck}
                    onEdit={() => editDeck(deck)}
                    onDelete={() => requestDeleteDeck(deck)}
                  />
                ))}
              </section>
            </div>
          </section>
        )}

        {inspectedCard && (
          <MobileDetailBackButton onBack={() => setInspectedCard(null)} />
        )}

        <div
          className={`relative z-10 mx-auto w-full max-w-[980px] px-4 sm:px-6 ${hideMobileLayoutOnDesktop ? "md:hidden" : ""}`}
        >
          {inspectedCard ? (
            <DeckBuilderMobileCardDetail card={inspectedCard} />
          ) : (
            <>
              <FigmaTopCard />

              {showFigmaEmptyState && (
                <FigmaBottomCard onCreateDeck={startNewDeck} />
              )}

              {isEditing && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <section className="mx-auto mt-6 w-full max-w-[375px] space-y-4">
                    <div className="rounded-[12px] bg-[#1a1d2e] px-[15.995px] pt-[15.995px] pb-[15.995px]">
                      <label htmlFor="deckName" className="sr-only">
                        Deck Name
                      </label>
                      <div className="relative flex h-[43px] items-center justify-center overflow-clip rounded-[10px] border-[0.5px] border-[#d2d2d2] bg-[#1a1d2e] px-[24px] py-[8px]">
                        <input
                          id="deckName"
                          value={deckName}
                          onChange={(event) => setDeckName(event.target.value)}
                          className="h-[27px] w-full bg-transparent px-[24px] text-center text-[18px] leading-[27px] font-normal text-[#e8e8e8] outline-none"
                          placeholder="My Deck"
                        />
                        <button
                          type="button"
                          className="absolute right-[24px] h-[20px] w-[20px]"
                          aria-label="Edit deck name"
                        >
                          <Image
                            src="/assets/deck-builder/v2/edit-icon.svg"
                            alt=""
                            fill
                            className="object-fill"
                          />
                        </button>
                      </div>
                    </div>

                    <DroppableSection
                      id={DECK_LIST_DROP_ID}
                      className="rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[12px] py-[16px]"
                      activeClassName="ring-2 ring-[#6ea8ff]"
                    >
                      <div className="mb-[16px] flex h-[35.975px] items-center justify-between">
                        <h2 className="text-[18px] leading-[28px] font-bold text-white">
                          Your Deck
                        </h2>
                        <button
                          type="button"
                          onClick={clearCurrentDeck}
                          className="relative h-[35.975px] w-[77.317px] rounded-[10px] bg-[#d00416]"
                        >
                          <Image
                            src="/assets/deck-builder/v2/clear-icon.svg"
                            alt=""
                            width={15.995}
                            height={15.995}
                            className="absolute left-[11.98px] top-[9.98px]"
                          />
                          <span className="absolute left-[49.46px] top-[7px] -translate-x-1/2 text-[14px] leading-[20px] font-bold text-white">
                            Clear
                          </span>
                        </button>
                      </div>

                      <div className="mb-[16px] rounded-[10px] bg-[#1a1d2e] px-[11.983px] pt-[11.983px] pb-[11.983px]">
                        <div className="grid grid-cols-3 gap-x-[12px]">
                          <div className="text-center">
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              Total Cards
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {selectedCards.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              [Deck Stats]
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {selectedCards.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">
                              Completion
                            </p>
                            <p className="text-[18px] leading-[28px] font-bold text-white">
                              {completionRate}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-[6px]">
                        {deckSlots.map((card, index) => (
                          <MobileDeckSlot
                            key={`slot-${index}-${card?.id ?? "empty"}`}
                            slotIndex={index}
                            card={card}
                            onRemove={() => removeCardFromDeck(index)}
                            onInspect={setInspectedCard}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={saveDeck}
                        className="relative mt-[16px] h-[47.957px] w-[348.459px] self-center shadow-[0px_5.184782px_12.961955px_0px_rgba(0,0,0,0.25)]"
                      >
                        <div className="absolute inset-0">
                          <Image
                            src="/assets/deck-builder/v2/save-union-tight.svg"
                            alt=""
                            fill
                            className="object-fill"
                          />
                        </div>
                        <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
                          <Image
                            src="/assets/deck-builder/v2/save-icon.svg"
                            alt=""
                            width={16.905}
                            height={16.905}
                          />
                          <span className="text-[14.102px] leading-[21.937px] font-bold text-white">
                            Save Deck
                          </span>
                        </span>
                      </button>
                    </DroppableSection>

                    <DroppableSection
                      id={AVAILABLE_LIST_DROP_ID}
                      className="rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] p-[12px]"
                      activeClassName="ring-2 ring-[#6ea8ff]"
                    >
                      <h2 className="mb-[12px] h-[35.975px] text-[18px] leading-[28px] font-bold text-white">
                        Available Cards
                      </h2>
                      {availableCardGrid.length === 0 ? (
                        <AvailableCardsEmptyState
                          mode={
                            !wallet
                              ? "wallet"
                              : inventoryCards.length === 0
                                ? "inventory"
                                : "used"
                          }
                          onConnect={openPicker}
                        />
                      ) : (
                        <div className="grid grid-cols-4 gap-[6px]">
                          {availableCardGrid.map((card, index) =>
                            card ? (
                              <MobileAvailableInventoryCard
                                key={`available-${card.id}`}
                                card={card}
                                remainingCount={
                                  remainingCountById.get(card.id) ?? 0
                                }
                                onAdd={() => handleQuickAdd(card)}
                                onInspect={() => setInspectedCard(card)}
                                isShaking={shakingCardId === card.id}
                              />
                            ) : (
                              <AvailableGridPlaceholder
                                key={`available-empty-${index}`}
                                mobile
                              />
                            ),
                          )}
                        </div>
                      )}
                    </DroppableSection>
                  </section>
                  <DragOverlay>
                    {activeDrag?.card ? (
                      <DragCardOverlay card={activeDrag.card} />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}

              {!isEditing && savedDecks.length > 0 && (
                <section className="mx-auto mt-6 w-full max-w-[375px] space-y-[16px]">
                  <FigmaWideCreateButton onCreateDeck={startNewDeck} />
                  <FigmaDeckSeparator />
                  <div className="space-y-[16px]">
                    {savedDecks.map((deck) => (
                      <FigmaSavedDeckCard
                        key={deck.id}
                        deck={deck}
                        onEdit={() => editDeck(deck)}
                        onDelete={() => requestDeleteDeck(deck)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {!inspectedCard && (
          <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/30 bg-[#272727] md:hidden">
            <ul className="mx-auto grid max-w-md grid-cols-5 px-2 py-2 text-[12px] text-white/70">
              <li>
                <Link
                  href="/"
                  className="flex flex-col items-center justify-center gap-1 py-1"
                >
                  <BottomNavIcon kind="home" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="flex flex-col items-center justify-center gap-1 py-1"
                >
                  <BottomNavIcon kind="market" />
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/gacha"
                  className="flex flex-col items-center justify-center gap-1 py-1"
                >
                  <BottomNavIcon kind="gacha" />
                  Gacha
                </Link>
              </li>
              <li>
                <Link
                  href="/deck"
                  className="flex flex-col items-center justify-center gap-1 py-1 text-white"
                >
                  <BottomNavIcon kind="deck" />
                  Deck
                </Link>
              </li>
              <li>
                <Link
                  href="/tournament"
                  className="flex flex-col items-center justify-center gap-1 py-1"
                >
                  <BottomNavIcon kind="tournament" />
                  Tournament
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {desktopFilterOpen && (
          <DeckBuilderFilterModal
            rarity={draftRarity}
            setRarity={setDraftRarity}
            zone={draftZone}
            setZone={setDraftZone}
            onClose={() => setDesktopFilterOpen(false)}
            onReset={() => {
              setDraftRarity("all");
              setDraftZone("all");
            }}
            onApply={() => {
              setDesktopRarity(draftRarity);
              setDesktopZone(draftZone);
              setDesktopFilterOpen(false);
            }}
          />
        )}
        {showLeaderRequiredModal && (
          <DeckBuilderLeaderRequiredModal
            onClose={() => setShowLeaderRequiredModal(false)}
          />
        )}
        {pendingDeleteDeck && (
          <DeckBuilderDeleteDeckModal
            deckName={pendingDeleteDeck.name}
            onClose={() => setPendingDeleteDeck(null)}
            onConfirm={confirmDeleteDeck}
          />
        )}
        {inspectedCard && (
          <div className="hidden md:block">
            <DeckBuilderCardModal
              card={inspectedCard}
              onClose={() => setInspectedCard(null)}
            />
          </div>
        )}
      </main>
    </PageBackground>
  );
}

export default function DeckBuilder() {
  const { wallet, openPicker } = useWallet();

  return (
    <DeckBuilderScreen
      key={wallet?.address ?? "guest"}
      wallet={wallet}
      openPicker={openPicker}
    />
  );
}
