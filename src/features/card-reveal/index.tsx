"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import PageBackground from "@/components/page-background";
import cardsData from "@/data/cards.json";
import type { PackSeries } from "@/hooks/usePackOpening";
import { useWallet } from "@/context/wallet-context";
import { useInventory } from "@/hooks/useInventory";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CardEntry {
  id: string;
  nftTokenId: string;
  name: string;
  subtitle: string;
  rarity: string;
  anime: string;
  imageUrl: string;
}

interface RevealCard {
  tokenId: number;
  name: string;
  subtitle: string;
  rarity: string;
  anime: string;
  imageUrl: string;
}

// Rarity glow for the reveal animation
const RARITY_GLOW: Record<string, string> = {
  Common: "",
  Rare: "drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]",
  Legendary: "drop-shadow-[0_0_16px_rgba(168,85,247,0.9)]",
  Mythic: "drop-shadow-[0_0_24px_rgba(234,179,8,1)]",
};

// Series theme
const SERIES_THEME: Record<PackSeries, { label: string; accent: string }> = {
  naruto: { label: "Naruto Pack", accent: "text-orange-400" },
  onepiece: { label: "One Piece Pack", accent: "text-blue-400" },
};

// Shimmer skeleton while IPFS image loads
function CardBackFallback() {
  return (
    <div className="w-full h-full bg-linear-to-b from-[#2d3548] to-[#030a30] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent" />
      <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
      <span className="text-white/20 text-xs mt-3">Loading…</span>
    </div>
  );
}

export default function CardReveal() {
  const [cards, setCards] = useState<RevealCard[]>([]);
  const [series, setSeries] = useState<PackSeries>("naruto");
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealedAll, setRevealedAll] = useState(false);
  const [showingCard, setShowingCard] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [noData, setNoData] = useState(false);

  const { wallet } = useWallet();
  const { addPulledCards } = useInventory(wallet?.address ?? null);

  // Load token IDs from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("packResult");
      if (!raw) {
        setNoData(true);
        return;
      }
      const { tokenIds, series: storedSeries } = JSON.parse(raw) as {
        tokenIds: number[];
        series?: PackSeries;
      };
      if (!tokenIds || tokenIds.length === 0) {
        setNoData(true);
        return;
      }

      if (storedSeries) setSeries(storedSeries);

      const lookup = new Map<string, CardEntry>(
        (cardsData as CardEntry[]).map((c) => [c.nftTokenId, c]),
      );

      const resolved: RevealCard[] = tokenIds.map((id) => {
        const entry = lookup.get(String(id));
        if (entry) {
          return {
            tokenId: id,
            name: entry.name,
            subtitle: entry.subtitle,
            rarity: entry.rarity,
            anime: entry.anime,
            imageUrl: entry.imageUrl,
          };
        }
        return {
          tokenId: id,
          name: `Card #${id}`,
          subtitle: "",
          rarity: "Common",
          anime: "Unknown",
          imageUrl: "",
        };
      });

      setCards(resolved);

      // Save pulled cards to this wallet's inventory
      addPulledCards(tokenIds, wallet?.address ?? "anonymous");
    } catch {
      setNoData(true);
    }
  }, []);

  const allDone = revealedCount >= cards.length && cards.length > 0;
  const isLastCard = cards.length > 0 && revealedCount === cards.length - 1;
  const cardBackSrc =
    isLastCard && !allDone ? "/assets/card-back.svg" : "/assets/back-cards.svg";

  const revealNext = useCallback(() => {
    if (allDone || revealedAll || showingCard) return;
    setImgError(false);
    setShowingCard(true);
  }, [allDone, revealedAll, showingCard]);

  const advanceToNext = useCallback(() => {
    setShowingCard(false);
    setImgError(false);
    setRevealedCount((c) => c + 1);
  }, []);

  const handleRevealAll = useCallback(() => {
    setRevealedAll(true);
    setRevealedCount(cards.length);
    setShowingCard(false);
  }, [cards.length]);

  const showGrid = revealedAll || allDone;
  const currentCard = cards[revealedCount];
  const theme = SERIES_THEME[series];

  // Cards to preload (next 2 in queue)
  const preloadCards = cards.slice(
    Math.min(revealedCount + 1, cards.length),
    Math.min(revealedCount + 3, cards.length),
  );

  // ── Empty / Error state ──────────────────────────────────────────────────
  if (noData) {
    return (
      <PageBackground>
        <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28 items-center">
          <h1 className="text-white font-bold text-2xl text-center">
            No Cards to Reveal
          </h1>
          <p className="text-white/50 text-sm text-center">
            Open a pack first to see your cards here.
          </p>
          <Link href="/open-packs">
            <button className="mt-4 px-6 py-2 rounded-xl bg-[#8855FF] text-white font-semibold text-sm">
              Open a Pack
            </button>
          </Link>
        </div>
      </PageBackground>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <PageBackground>
        <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 items-center">
          <p className="text-white/50 animate-pulse">Loading your cards…</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      {/* Hidden preload images — fetched immediately, ready when user taps Next */}
      {preloadCards.map((c) =>
        c.imageUrl ? (
          <Image
            key={`pre-${c.tokenId}`}
            src={c.imageUrl}
            alt=""
            width={736}
            height={1030}
            className="hidden"
            priority
            aria-hidden
          />
        ) : null,
      )}
      {/* Mobile */}
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28">
        {/* Heading with series label */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-white font-bold text-2xl">You Got:</h1>
          <p className={`text-sm font-semibold mt-0.5 ${theme.accent}`}>
            {theme.label}
          </p>
        </motion.div>

        {/* Card count indicator */}
        {!showGrid && (
          <p className="text-white/40 text-xs text-center">
            {revealedCount + 1} / {cards.length}
          </p>
        )}

        {!showGrid ? (
          <div
            className="relative w-full aspect-3/4 cursor-pointer"
            onClick={showingCard ? advanceToNext : revealNext}
          >
            {showingCard && currentCard ? (
              /* ── Revealed NFT card ── */
              <motion.div
                className="relative w-full h-full"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {currentCard.imageUrl && !imgError ? (
                  <Image
                    src={currentCard.imageUrl}
                    alt={currentCard.name}
                    width={736}
                    height={1030}
                    className={`w-full h-full object-contain ${RARITY_GLOW[currentCard.rarity] ?? ""}`}
                    draggable={false}
                    priority
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <CardBackFallback />
                )}
              </motion.div>
            ) : (
              <Image
                src={cardBackSrc}
                alt="Card Back"
                width={736}
                height={1030}
                className="w-full h-full object-contain"
                draggable={false}
                priority
              />
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {cards.map((card, i) => (
              <motion.div
                key={`${card.tokenId}-${i}`}
                className="relative"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 }}
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    width={240}
                    height={336}
                    className={`w-full h-auto rounded-lg ${RARITY_GLOW[card.rarity] ?? ""}`}
                    draggable={false}
                    unoptimized
                  />
                ) : (
                  <div className="w-full aspect-3/4 rounded-lg bg-[#2d3548] flex items-center justify-center">
                    <span className="text-white/30 text-xs text-center px-1">
                      #{card.tokenId}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {!showGrid && (
          <div className="flex flex-col gap-1">
            <motion.button
              className="w-full cursor-pointer"
              onClick={showingCard ? advanceToNext : revealNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Image
                src="/assets/next-btn.svg"
                alt="Next"
                width={375}
                height={64}
                className="w-full h-auto"
                draggable={false}
              />
            </motion.button>

            <motion.button
              className="w-full cursor-pointer"
              onClick={handleRevealAll}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Image
                src="/assets/reveal-all-btn.svg"
                alt="Reveal All"
                width={375}
                height={64}
                className="w-full h-auto"
                draggable={false}
              />
            </motion.button>
          </div>
        )}

        {showGrid && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
          >
            <Link href="/inventory">
              <motion.button
                className="w-full cursor-pointer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Image
                  src="/assets/view-collection-btn.svg"
                  alt="View Collection"
                  width={375}
                  height={64}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex flex-col items-center w-full max-w-4xl mx-auto px-8 pt-24 pb-20 gap-8">
        <motion.h1
          className="text-white font-bold text-4xl text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          You Got:
        </motion.h1>

        {!showGrid ? (
          <>
            {/* Glass panel with card */}
            <motion.div
              className=" border border-white/10 bg-linear-to-b from-[#2D3548] to-[#030A30] rounded-2xl p-8 flex flex-col items-center w-full"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="w-64 cursor-pointer"
                onClick={showingCard ? advanceToNext : revealNext}
              >
                {showingCard && currentCard ? (
                  currentCard.imageUrl && !imgError ? (
                    <Image
                      src={currentCard.imageUrl}
                      alt={currentCard.name}
                      width={736}
                      height={1030}
                      className={`w-full h-auto rounded-xl ${RARITY_GLOW[currentCard.rarity] ?? ""}`}
                      draggable={false}
                      priority
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <CardBackFallback />
                  )
                ) : (
                  <Image
                    src={cardBackSrc}
                    alt="Card Back"
                    width={736}
                    height={1030}
                    className="w-full h-auto rounded-xl"
                    draggable={false}
                    priority
                  />
                )}
              </div>
            </motion.div>

            {/* Desktop action buttons */}
            <div className="flex flex-col gap-2 w-full">
              <motion.button
                className="w-full cursor-pointer"
                onClick={showingCard ? advanceToNext : revealNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Image
                  src="/assets/desktop-next-btn.svg"
                  alt="Next"
                  width={962}
                  height={74}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>

              <motion.button
                className="w-full cursor-pointer"
                onClick={handleRevealAll}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Image
                  src="/assets/desktop-reveal-all-btn.svg"
                  alt="Reveal All"
                  width={962}
                  height={74}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>
            </div>
          </>
        ) : (
          <>
            {/* 5-column reveal grid */}
            <motion.div
              className="grid grid-cols-5 gap-4 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {cards.map((card, i) => (
                <motion.div
                  key={`${card.tokenId}-${i}`}
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.1 }}
                >
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      width={736}
                      height={1030}
                      className={`w-full h-auto rounded-lg ${RARITY_GLOW[card.rarity] ?? ""}`}
                      draggable={false}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full aspect-3/4 rounded-lg bg-[#2d3548] flex items-center justify-center">
                      <span className="text-white/30 text-xs text-center px-1">#{card.tokenId}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* View Collection */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
            >
              <Link href="/inventory">
                <motion.button
                  className="w-full cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image
                    src="/assets/desktop-view-collection-btn.svg"
                    alt="View Collection"
                    width={977}
                    height={64}
                    className="w-full h-auto"
                    draggable={false}
                  />
                </motion.button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </PageBackground>
  );
}
