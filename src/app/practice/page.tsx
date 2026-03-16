"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import PageBackground from "@/components/page-background";
import cardsData from "@/data/cards.json";
import { useWallet } from "@/context/wallet-context";

type CardZone = "Frontline" | "Backline" | "Reserve";
type CardRarity = "Common" | "Rare" | "Legendary" | "Mythic";

type PracticeCard = {
  id: number;
  name: string;
  subtitle: string;
  art: string;
  rarity: CardRarity;
  traits: string[];
  abilityDescription: string;
  leaderEligible: boolean;
  leaderDescription: string | null;
  zone: CardZone | null;
  zones: CardZone[];
};

type SavedDeck = {
  id: number;
  name: string;
  cards: Array<PracticeCard | null>;
};

type PersistedDeckState = {
  savedDecks?: Array<{
    id?: number;
    name?: string;
    cards?: unknown[];
  }>;
};

type CatalogCard = {
  nftTokenId: string;
  name: string;
  subtitle?: string;
  rarity: CardRarity;
  imageUrl: string;
  traits?: string[];
  ability?: {
    description?: string | null;
  } | null;
  leaderAbility?: {
    description?: string | null;
  } | null;
  leaderEligible?: boolean;
  zone?: string;
  zones?: string[];
};

const TOTAL_SLOTS = 12;
const BATTLE_RARITY_LIMITS: Partial<Record<CardRarity, number>> = {
  Mythic: 1,
  Legendary: 2,
  Rare: 2,
};
const PLAYER_DESKTOP_ORDER = [8, 4, 0, 9, 5, 1, 10, 6, 2, 11, 7, 3];
const BOT_DESKTOP_ORDER = [3, 7, 11, 2, 6, 10, 1, 5, 9, 0, 4, 8];
const PLAYER_MOBILE_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const BOT_MOBILE_ORDER = [8, 9, 10, 11, 4, 5, 6, 7, 1, 2, 3, 0];

function isCardZone(value: string): value is CardZone {
  return value === "Frontline" || value === "Backline" || value === "Reserve";
}

function normalizeZones(zone?: string | null, zones?: string[]) {
  return [...new Set([...(zones ?? []), ...(zone ? [zone] : [])])].filter(
    isCardZone,
  );
}

function getSlotLabel(slotIndex: number) {
  if (slotIndex === 0) return "Leader";
  if (slotIndex >= 1 && slotIndex <= 3) return "Frontline";
  if (slotIndex >= 4 && slotIndex <= 7) return "Backline";
  return "Reserve";
}

function deckStorageKey(address: string) {
  return `deck_builder_${address.toLowerCase()}`;
}

const PRACTICE_CATALOG: PracticeCard[] = (cardsData as CatalogCard[]).flatMap(
  (card) => {
    const id = Number.parseInt(card.nftTokenId, 10);
    if (!Number.isInteger(id)) {
      return [];
    }

    const zones = normalizeZones(card.zone, card.zones);

    return [
      {
        id,
        name: card.name,
        subtitle: card.subtitle ?? "",
        art: card.imageUrl,
        rarity: card.rarity,
        traits: card.traits ?? [],
        abilityDescription: card.ability?.description ?? "",
        leaderEligible: card.leaderEligible ?? false,
        leaderDescription: card.leaderAbility?.description ?? null,
        zone: zones[0] ?? null,
        zones,
      } satisfies PracticeCard,
    ];
  },
);

const PRACTICE_CARD_LOOKUP = new Map(
  PRACTICE_CATALOG.map((card) => [card.id, card]),
);

function hydratePracticeCard(card: unknown): PracticeCard | null {
  if (!card || typeof card !== "object") {
    return null;
  }

  const parsedCard = card as Partial<{
    id: number;
    name: string;
    subtitle: string;
    art: string;
    rarity: CardRarity;
    traits: string[];
    abilityDescription: string;
    leaderEligible: boolean;
    leaderDescription: string | null;
    zone: CardZone | null;
    zones: CardZone[];
  }>;

  if (typeof parsedCard.id !== "number" || !Number.isFinite(parsedCard.id)) {
    return null;
  }

  const catalogCard = PRACTICE_CARD_LOOKUP.get(parsedCard.id);
  const zones = normalizeZones(parsedCard.zone ?? null, parsedCard.zones);
  const resolvedZones = zones.length > 0 ? zones : (catalogCard?.zones ?? []);

  return {
    id: parsedCard.id,
    name: parsedCard.name ?? catalogCard?.name ?? `Card #${parsedCard.id}`,
    subtitle: parsedCard.subtitle ?? catalogCard?.subtitle ?? "",
    art: parsedCard.art ?? catalogCard?.art ?? "",
    rarity: parsedCard.rarity ?? catalogCard?.rarity ?? "Common",
    traits: parsedCard.traits ?? catalogCard?.traits ?? [],
    abilityDescription:
      parsedCard.abilityDescription ?? catalogCard?.abilityDescription ?? "",
    leaderEligible:
      parsedCard.leaderEligible ?? catalogCard?.leaderEligible ?? false,
    leaderDescription:
      parsedCard.leaderDescription ?? catalogCard?.leaderDescription ?? null,
    zone: resolvedZones[0] ?? catalogCard?.zone ?? null,
    zones: resolvedZones,
  };
}

function padDeck(cards: Array<PracticeCard | null>) {
  const next = cards.slice(0, TOTAL_SLOTS);
  while (next.length < TOTAL_SLOTS) {
    next.push(null);
  }
  return next;
}

function loadSavedDecks(address: string | null) {
  if (!address || typeof window === "undefined") {
    return [] as SavedDeck[];
  }

  try {
    const raw = localStorage.getItem(deckStorageKey(address));
    if (!raw) {
      return [] as SavedDeck[];
    }

    const parsed = JSON.parse(raw) as PersistedDeckState;
    if (!Array.isArray(parsed.savedDecks)) {
      return [] as SavedDeck[];
    }

    return parsed.savedDecks
      .map((deck) => {
        if (typeof deck?.id !== "number") {
          return null;
        }

        const cards = Array.isArray(deck.cards)
          ? deck.cards.map((card) => hydratePracticeCard(card))
          : [];

        return {
          id: deck.id,
          name: typeof deck.name === "string" ? deck.name : `Deck ${deck.id}`,
          cards: padDeck(cards),
        } satisfies SavedDeck;
      })
      .filter((deck): deck is SavedDeck => deck !== null);
  } catch {
    return [] as SavedDeck[];
  }
}

function shuffleCards(cards: PracticeCard[]) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function canAddBattleDeckCard(
  card: PracticeCard,
  rarityCounts: Map<CardRarity, number>,
) {
  const limit = BATTLE_RARITY_LIMITS[card.rarity];
  if (typeof limit !== "number") {
    return true;
  }

  return (rarityCounts.get(card.rarity) ?? 0) < limit;
}

function generateBotDeck() {
  const nextDeck = Array.from(
    { length: TOTAL_SLOTS },
    () => null,
  ) as Array<PracticeCard | null>;
  const usedIds = new Set<number>();
  const battleRarityCounts = new Map<CardRarity, number>();

  const takeCard = (slotIndex: number, card: PracticeCard) => {
    nextDeck[slotIndex] = card;
    usedIds.add(card.id);

    if (slotIndex < 8) {
      battleRarityCounts.set(
        card.rarity,
        (battleRarityCounts.get(card.rarity) ?? 0) + 1,
      );
    }
  };

  const findCard = ({
    slotIndex,
    zone,
    leaderOnly = false,
  }: {
    slotIndex: number;
    zone?: CardZone;
    leaderOnly?: boolean;
  }) =>
    shuffleCards(PRACTICE_CATALOG).find(
      (card) =>
        !usedIds.has(card.id) &&
        (!leaderOnly || card.leaderEligible) &&
        (!zone || card.zones.includes(zone)) &&
        (slotIndex >= 8 || canAddBattleDeckCard(card, battleRarityCounts)),
    ) ?? null;

  const leader = findCard({ slotIndex: 0, leaderOnly: true });
  if (leader) {
    takeCard(0, leader);
  }

  for (const slotIndex of [1, 2, 3]) {
    const card = findCard({ slotIndex, zone: "Frontline" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  for (const slotIndex of [4, 5, 6, 7]) {
    const card = findCard({ slotIndex, zone: "Backline" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  for (const slotIndex of [8, 9, 10, 11]) {
    const card = findCard({ slotIndex, zone: "Reserve" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  return nextDeck;
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

function PracticeAttackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18 18 6" />
      <path d="m12 6 6 0 0 6" />
      <path d="M6 6l6 6" />
      <path d="M6 12V6h6" />
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

function getPracticeCardTraits(card: PracticeCard) {
  if (card.traits.length > 0) {
    return card.traits;
  }

  return card.zones;
}

function PracticeMobileCardDetail({ card }: { card: PracticeCard }) {
  const rarityMeta: Record<
    CardRarity,
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
  const detailTraits = getPracticeCardTraits(card);

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

function PracticeCardModal({
  card,
  onClose,
}: {
  card: PracticeCard;
  onClose: () => void;
}) {
  const rarityMeta: Record<
    CardRarity,
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
  const detailTraits = getPracticeCardTraits(card);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] md:p-6">
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

            <div className="mt-5 flex-1 rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pb-4 pt-[17px]">
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
          </div>
        </div>
      </div>
    </div>
  );
}

function ArenaCard({
  card,
  slotIndex,
  side,
  onInspect,
}: {
  card: PracticeCard | null;
  slotIndex: number;
  side: "player" | "bot";
  onInspect: (card: PracticeCard) => void;
}) {
  const isLeader = slotIndex === 0;
  const slotLabel = getSlotLabel(slotIndex);
  const isInspectable = card !== null;
  const showAttackIcon = side === "player" && card !== null;
  const leaderShift =
    side === "player"
      ? "-translate-y-[16%] lg:translate-y-0 lg:translate-x-[34%]"
      : "translate-y-[16%] lg:translate-y-0 lg:-translate-x-[34%]";

  return (
    <div
      className={`relative aspect-[148/204] ${
        isLeader ? `z-10 ${leaderShift}` : ""
      }`}
    >
      {card ? (
        <button
          type="button"
          onClick={() => onInspect(card)}
          className="absolute inset-0 cursor-pointer"
          aria-label={`View ${card.name}`}
        >
          <Image
            src={card.art}
            alt={card.name}
            fill
            className="object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
            unoptimized
          />
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/18 bg-[radial-gradient(circle_at_top,#1d3567_0%,#11192f_55%,#0a0d18_100%)] px-2 text-center">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-white/45 uppercase md:text-[11px]">
            {slotLabel}
          </p>
        </div>
      )}
      {isInspectable && showAttackIcon && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onInspect(card);
          }}
          className="absolute right-[8px] top-[8px] z-10 flex h-[28px] min-w-[28px] items-center justify-center rounded-full bg-[#010b7b]/90 px-2 text-white shadow-lg"
          aria-label={`Attack with ${card.name}`}
        >
          <PracticeAttackIcon />
        </button>
      )}
    </div>
  );
}

function ArenaGrid({
  title,
  cards,
  side,
  onInspect,
}: {
  title: string;
  cards: Array<PracticeCard | null>;
  side: "player" | "bot";
  onInspect: (card: PracticeCard) => void;
}) {
  const mobileOrder =
    side === "player" ? PLAYER_MOBILE_ORDER : BOT_MOBILE_ORDER;
  const desktopOrder =
    side === "player" ? PLAYER_DESKTOP_ORDER : BOT_DESKTOP_ORDER;
  const header = (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#78a8ff] uppercase">
          {side === "player" ? "Player Side" : "Bot Side"}
        </p>
        <h2 className="mt-2 text-[22px] font-bold text-white">{title}</h2>
      </div>
    </div>
  );

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-5">
      {side === "player" ? <div className="hidden lg:block">{header}</div> : header}

      <div className="grid grid-cols-4 gap-3 md:gap-4 lg:hidden">
        {mobileOrder.map((slotIndex) => (
          <ArenaCard
            key={`${side}-mobile-${slotIndex}`}
            card={cards[slotIndex] ?? null}
            slotIndex={slotIndex}
            side={side}
            onInspect={onInspect}
          />
        ))}
      </div>

      {side === "player" && <div className="mt-4 lg:hidden">{header}</div>}

      <div className="hidden grid-cols-3 gap-3 md:gap-4 lg:grid">
        {desktopOrder.map((slotIndex) => (
          <ArenaCard
            key={`${side}-desktop-${slotIndex}`}
            card={cards[slotIndex] ?? null}
            slotIndex={slotIndex}
            side={side}
            onInspect={onInspect}
          />
        ))}
      </div>
    </section>
  );
}

function PracticeDeckModal({
  open,
  savedDecks,
  wallet,
  isConnecting,
  walletError,
  openPicker,
  onClose,
  onSelectDeck,
}: {
  open: boolean;
  savedDecks: SavedDeck[];
  wallet: ReturnType<typeof useWallet>["wallet"];
  isConnecting: boolean;
  walletError: string | null;
  openPicker: ReturnType<typeof useWallet>["openPicker"];
  onClose: () => void;
  onSelectDeck: (deck: SavedDeck) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close deck selection modal"
      />

      <div className="relative z-10 flex max-h-[min(88vh,780px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-[#32406b] bg-[#0d1330] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 px-5 py-5 md:px-7">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-[#78a8ff] uppercase">
            Practice Setup
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-white">
            Choose Your Deck
          </h2>
          <p className="mt-3 max-w-[640px] text-sm leading-[22px] text-white/58">
            Pick one of your saved decks to place on the left side of the arena.
            The bot deck will be generated automatically and will still follow
            the current deck-building rules.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
          {!wallet ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold text-white">
                Connect a wallet first
              </p>
              <p className="mt-3 text-sm text-white/55">
                Saved practice decks are loaded from the wallet-linked deck
                builder storage.
              </p>
              <button
                type="button"
                onClick={openPicker}
                disabled={isConnecting}
                className="relative mx-auto mt-5 block w-full max-w-[181px] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Image
                  src="/assets/connect-wallet-btn.svg"
                  alt="Connect Wallet"
                  width={181}
                  height={46}
                  className="h-auto w-full"
                />
                {isConnecting && (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                    Connecting...
                  </span>
                )}
              </button>
              {walletError && (
                <p className="mx-auto mt-3 max-w-[260px] text-xs leading-tight text-red-400">
                  {walletError}
                </p>
              )}
            </div>
          ) : savedDecks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold text-white">
                No saved decks yet
              </p>
              <p className="mt-3 text-sm text-white/55">
                Build and save a deck first before starting a practice match.
              </p>
              <Link
                href="/deck"
                className="mt-5 inline-flex rounded-full bg-[#0f56d9] px-5 py-3 text-sm font-semibold text-white"
              >
                Go to Deck Builder
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedDecks.map((deck) => {
                const previewCards = deck.cards.filter(
                  (card): card is PracticeCard => card !== null,
                );

                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => onSelectDeck(deck)}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151d3a_0%,#0d1327_100%)] p-4 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#78a8ff] uppercase">
                          Deck {deck.id}
                        </p>
                        <h3 className="mt-2 truncate text-lg font-bold text-white">
                          {deck.name}
                        </h3>
                      </div>
                      <p className="text-xs text-white/45">
                        {previewCards.length}/{TOTAL_SLOTS}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {previewCards.slice(0, 4).map((card) => (
                        <div
                          key={`${deck.id}-${card.id}`}
                          className="relative aspect-[148/204] overflow-hidden rounded-[12px] border border-white/10 bg-white/5"
                        >
                          <Image
                            src={card.art}
                            alt={card.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const { wallet, isConnecting, error, openPicker } = useWallet();
  const [inspectedCard, setInspectedCard] = useState<PracticeCard | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
  const [playerDeck, setPlayerDeck] = useState<Array<PracticeCard | null>>(
    padDeck([]),
  );
  const [botDeck, setBotDeck] = useState<Array<PracticeCard | null>>(
    padDeck([]),
  );
  const [showDeckModal, setShowDeckModal] = useState(false);
  const savedDecks = useMemo(
    () => loadSavedDecks(wallet?.address ?? null),
    [wallet?.address],
  );

  const openDeckModal = () => {
    setShowDeckModal(true);
  };

  const handleDeckSelect = (deck: SavedDeck) => {
    setSelectedDeck(deck);
    setPlayerDeck(padDeck(deck.cards));
    setBotDeck(generateBotDeck());
    setShowDeckModal(false);
  };

  return (
    <PageBackground>
      <div className="bg-transparent py-10 font-sans">
        {inspectedCard && (
          <MobileDetailBackButton onBack={() => setInspectedCard(null)} />
        )}

        <div className={`${inspectedCard ? "hidden" : "block"} px-4 pb-4 pt-18 text-center lg:hidden`}>
          <h1 className="text-[2rem] font-bold text-white">Practice Match</h1>
          <p className="mt-3 text-sm text-white/55">
            Choose one of your saved decks, then face a bot deck generated under
            the same rules.
          </p>
        </div>

        <div className="hidden w-full bg-transparent pb-0 pt-30 lg:block">
          <h1 className="mb-4 text-center text-7xl font-bold text-white">
            Practice Match
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm text-gray-400">
            Choose one of your saved decks, then face a bot deck generated under
            the same rules.
          </p>
          <div className="w-full overflow-hidden">
            <Image
              src="/assets/tournament-page/outline.svg"
              alt=""
              width={1600}
              height={120}
              className="pointer-events-none max-w-4xl lg:max-w-4xl xl:max-w-7xl"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-4 pb-2 lg:px-0 lg:py-12">
          {inspectedCard ? (
            <div className="md:hidden">
              <PracticeMobileCardDetail card={inspectedCard} />
            </div>
          ) : (
            <div className="mt-10 rounded-[32px] border border-[#8085BD] bg-[linear-gradient(to_top,#120C35_8%,#143C87_45%,#13245E_98%)] px-4 py-5 md:px-6 md:py-6 lg:-mx-6 lg:mt-0 lg:w-[calc(100%+3rem)] xl:-mx-10 xl:w-[calc(100%+5rem)]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] lg:items-center xl:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
                <div className="order-2 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-[12px] font-semibold tracking-[0.16em] text-[#9dc1ff] uppercase">
                    Battle Arena
                  </p>
                  <div className="rounded-full border border-white/12 bg-white/6 px-6 py-2 text-[28px] font-black text-white/80">
                    VS
                  </div>
                  <button
                    type="button"
                    onClick={openDeckModal}
                    className="mt-1 block w-full max-w-[250px]"
                  >
                    <Image
                      src="/assets/tournament-page/start_practice.svg"
                      alt="Start Practice"
                      width={250}
                      height={60}
                      className="h-auto w-full"
                    />
                  </button>
                </div>

                <div className="order-1 lg:order-3">
                  <ArenaGrid
                    title="Bot Deck"
                    cards={botDeck}
                    side="bot"
                    onInspect={setInspectedCard}
                  />
                </div>

                <div className="order-3 lg:order-1">
                  <ArenaGrid
                    title={selectedDeck?.name ?? "Saved Deck"}
                    cards={playerDeck}
                    side="player"
                    onInspect={setInspectedCard}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <PracticeDeckModal
          open={showDeckModal}
          savedDecks={savedDecks}
          wallet={wallet}
          isConnecting={isConnecting}
          walletError={error}
          openPicker={openPicker}
          onClose={() => setShowDeckModal(false)}
          onSelectDeck={handleDeckSelect}
        />
        {inspectedCard && (
          <div className="hidden md:block">
            <PracticeCardModal
              card={inspectedCard}
              onClose={() => setInspectedCard(null)}
            />
          </div>
        )}
      </div>
    </PageBackground>
  );
}
