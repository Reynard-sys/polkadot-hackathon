"use client";
import { useEffect, useCallback, useState } from "react";
import cardsData from "@/data/cards.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardRarity = "Common" | "Rare" | "Legendary" | "Mythic";
export type CardAnime  = "Naruto" | "OnePiece";

export interface OwnedCard {
  tokenId:  number;
  name:     string;
  subtitle: string;
  rarity:   CardRarity;
  anime:    CardAnime;
  imageUrl: string;
  count:    number; // how many copies owned
}

// ── localStorage key ──────────────────────────────────────────────────────────

function storageKey(address: string) {
  return `inventory_${address.toLowerCase()}`;
}

// ── Lookup table: tokenId → card metadata ─────────────────────────────────────

interface RawCard {
  nftTokenId: string;
  name:       string;
  subtitle:   string;
  rarity:     string;
  anime:      string;
  imageUrl:   string;
}

const CARD_LOOKUP = new Map<number, RawCard>(
  (cardsData as RawCard[]).map((c) => [parseInt(c.nftTokenId, 10), c])
);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInventory(walletAddress: string | null) {
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);

  // Load from localStorage when wallet changes
  useEffect(() => {
    if (!walletAddress || typeof window === "undefined") {
      setOwnedCards([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(walletAddress));
      setOwnedCards(raw ? JSON.parse(raw) : []);
    } catch {
      setOwnedCards([]);
    }
  }, [walletAddress]);

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
      const current = ownedCards;
      const next = [...current];

      for (const id of tokenIds) {
        const meta = CARD_LOOKUP.get(id);
        if (!meta) continue;

        const existing = next.find((c) => c.tokenId === id);
        if (existing) {
          existing.count += 1;
        } else {
          next.push({
            tokenId:  id,
            name:     meta.name,
            subtitle: meta.subtitle,
            rarity:   meta.rarity  as CardRarity,
            anime:    meta.anime   as CardAnime,
            imageUrl: meta.imageUrl,
            count:    1,
          });
        }
      }

      persist(next, address);
    },
    [ownedCards, persist]
  );

  return { ownedCards, addPulledCards };
}
