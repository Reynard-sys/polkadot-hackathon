"use client";
import { useEffect, useCallback, useMemo, useState } from "react";
import cardsData from "@/data/cards.json";
import { getFastCardImageUrl } from "@/lib/card-images";
import type { InventoryCardInstanceDto } from "@/lib/stellar/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardRarity = "Common" | "Rare" | "Legendary" | "Mythic";
export type CardAnime  = "Naruto" | "OnePiece" | "Pokemon";

export interface OwnedCard {
  tokenId:             number;
  name:                string;
  subtitle:            string;
  rarity:              CardRarity;
  anime:               CardAnime;
  imageUrl:            string;
  count:               number; // how many copies owned
  traits:              string[];
  abilityDescription:  string;
  leaderEligible:      boolean;
  leaderDescription:   string | null;
  sourceType?:         "demo" | "artist" | "ip";
  sourceName?:         string;
  playable?:           boolean;
  supplyCap?:          number | null;
  issuedCount?:        number | null;
  serialNumber?:       number | null;
  instanceIds?:        string[];
  availableInstanceIds?: string[];
  listedInstanceIds?:  string[];
}

// ── localStorage key ──────────────────────────────────────────────────────────

function storageKey(address: string) {
  return `inventory_${address.toLowerCase()}`;
}

// ── Lookup table: tokenId → card metadata ─────────────────────────────────────

interface RawAbility { description?: string }

interface RawCard {
  nftTokenId:      string;
  name:            string;
  subtitle:        string;
  rarity:          string;
  anime:           string;
  imageUrl:        string;
  traits?:         string[];
  ability?:        RawAbility | null;
  leaderAbility?:  RawAbility | null;
  leaderEligible?: boolean;
}

const CARD_LOOKUP = new Map<number, RawCard>(
  (cardsData as RawCard[]).map((c) => [parseInt(c.nftTokenId, 10), c])
);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInventory(walletAddress: string | null) {
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryCardInstanceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress || typeof window === "undefined") {
      setOwnedCards([]);
      setInventoryItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Inventory session unavailable.");
      }
      const payload = (await response.json()) as { items?: InventoryCardInstanceDto[] };
      const items = payload.items ?? [];
      setInventoryItems(items);

      const aggregated = new Map<string, OwnedCard>();
      for (const item of items) {
        const key = item.catalogId;
        const existing = aggregated.get(key);
        if (existing) {
          existing.count += 1;
          existing.instanceIds = [...(existing.instanceIds ?? []), item.instanceId];
          if (item.status === "owned") {
            existing.availableInstanceIds = [
              ...(existing.availableInstanceIds ?? []),
              item.instanceId,
            ];
          } else if (item.status === "listed") {
            existing.listedInstanceIds = [
              ...(existing.listedInstanceIds ?? []),
              item.instanceId,
            ];
          }
          continue;
        }

        aggregated.set(key, {
          tokenId: item.tokenId ?? 0,
          name: item.name,
          subtitle: item.subtitle ?? "",
          rarity: item.rarity as CardRarity,
          anime: item.anime as CardAnime,
          imageUrl: getFastCardImageUrl(item.imageUrl),
          count: 1,
          traits: item.traits,
          abilityDescription:
            (item.ability as { description?: string } | null)?.description ?? "",
          leaderEligible: item.leaderEligible,
          leaderDescription:
            (item.leaderAbility as { description?: string } | null)?.description ?? null,
          sourceType: item.sourceType,
          sourceName: item.sourceName,
          playable: item.playable,
          supplyCap: item.supplyCap,
          issuedCount: item.issuedCount,
          serialNumber: item.serialNumber,
          instanceIds: [item.instanceId],
          availableInstanceIds: item.status === "owned" ? [item.instanceId] : [],
          listedInstanceIds: item.status === "listed" ? [item.instanceId] : [],
        });
      }

      // Demo packs are intentionally stored in the browser. Merge those copies
      // with database-backed instances so a healthy API response does not hide
      // the local collection. `max` avoids double-counting legacy copies after
      // they have been imported into the database.
      try {
        const raw = localStorage.getItem(storageKey(walletAddress));
        const localCards = raw ? (JSON.parse(raw) as OwnedCard[]) : [];
        const backendByTokenId = new Map(
          [...aggregated.values()].map((card) => [card.tokenId, card]),
        );

        for (const localCard of localCards) {
          localCard.imageUrl = getFastCardImageUrl(localCard.imageUrl);
          const backendCard = backendByTokenId.get(localCard.tokenId);

          if (backendCard) {
            backendCard.count = Math.max(backendCard.count, localCard.count);
          } else {
            aggregated.set(`local:${localCard.tokenId}`, localCard);
          }
        }
      } catch {
        // Ignore malformed legacy browser data; backend inventory remains valid.
      }

      setOwnedCards([...aggregated.values()]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load inventory.");
      try {
        const raw = localStorage.getItem(storageKey(walletAddress));
        setOwnedCards(raw ? JSON.parse(raw) : []);
      } catch {
        setOwnedCards([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Persist to localStorage
  const persist = useCallback(
    (cards: OwnedCard[], address: string) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(storageKey(address), JSON.stringify(cards));
      setOwnedCards(cards);
    },
    []
  );

  /**
   * Merge a list of newly pulled token IDs into this wallet's inventory.
   * Duplicates increment the `count` field.
   */
  const addPulledCards = useCallback(
    (tokenIds: number[], address: string) => {
      // Always read fresh from localStorage to avoid stale-closure bug.
      // (The useEffect in card-reveal mounts once with empty ownedCards state,
      // so relying on the closure would wipe prior inventory on every pack open.)
      let current: OwnedCard[] = [];
      try {
        const raw = localStorage.getItem(storageKey(address));
        current = raw ? JSON.parse(raw) : [];
      } catch { current = []; }
      const next = [...current];

      for (const id of tokenIds) {
        const meta = CARD_LOOKUP.get(id);
        if (!meta) continue;

        const existing = next.find((c) => c.tokenId === id);
        if (existing) {
          existing.count += 1;
        } else {
          next.push({
            tokenId:            id,
            name:               meta.name,
            subtitle:           meta.subtitle,
            rarity:             meta.rarity  as CardRarity,
            anime:              meta.anime   as CardAnime,
            imageUrl:           getFastCardImageUrl(meta.imageUrl),
            count:              1,
            traits:             meta.traits ?? [],
            abilityDescription: meta.ability?.description ?? "",
            leaderEligible:     meta.leaderEligible ?? false,
            leaderDescription:  meta.leaderAbility?.description ?? null,
          });
        }
      }

      persist(next, address);
    },
    [persist]
  );

  const migrationAvailable = useMemo(() => {
    if (!walletAddress || typeof window === "undefined") return false;
    const local = localStorage.getItem(storageKey(walletAddress));
    if (!local) return false;
    try {
      const parsed = JSON.parse(local) as OwnedCard[];
      return parsed.length > 0 && inventoryItems.length === 0;
    } catch {
      return false;
    }
  }, [inventoryItems.length, walletAddress]);

  const migrateLegacyInventory = useCallback(async () => {
    if (!walletAddress || typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey(walletAddress));
    const parsed = raw ? (JSON.parse(raw) as OwnedCard[]) : [];
    const tokenIds = parsed.flatMap((card) =>
      Array.from({ length: card.count }, () => card.tokenId),
    );

    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tokenIds }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Failed to migrate legacy inventory.");
    }

    await refresh();
  }, [refresh, walletAddress]);

  return {
    ownedCards,
    inventoryItems,
    isLoading,
    error,
    addPulledCards,
    refresh,
    migrationAvailable,
    migrateLegacyInventory,
  };
}
