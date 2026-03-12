"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import PageBackground from "@/components/page-background";

const cards = [
  { src: "/assets/left-card.webp", alt: "Card 1" },
  { src: "/assets/center-card.webp", alt: "Card 2" },
  { src: "/assets/right-card.webp", alt: "Card 3" },
];

export default function CardReveal() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealedAll, setRevealedAll] = useState(false);
  const [showingCard, setShowingCard] = useState(false);

  const allDone = revealedCount >= cards.length;
  const isLastCard = revealedCount === cards.length - 1;

  // Card-back SVG: stacked look when >1 remaining, single when last
  const cardBackSrc =
    isLastCard && !allDone ? "/assets/card-back.svg" : "/assets/back-cards.svg";

  const revealNext = useCallback(() => {
    if (allDone || revealedAll || showingCard) return;

    // Instantly show the current card
    setShowingCard(true);
  }, [allDone, revealedAll, showingCard]);

  const advanceToNext = useCallback(() => {
    // Go back to card-back for next card
    setShowingCard(false);
    setRevealedCount((c) => c + 1);
  }, []);

  const handleRevealAll = useCallback(() => {
    setRevealedAll(true);
    setRevealedCount(cards.length);
    setShowingCard(false);
  }, []);

  const showGrid = revealedAll || allDone;

  return (
    <PageBackground>
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28">
        {/* Heading */}
        <motion.h1
          className="text-white font-bold text-2xl text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          You Got:
        </motion.h1>

        {/* Card area */}
        {!showGrid ? (
          <div
            className="relative w-full aspect-3/4 cursor-pointer"
            onClick={showingCard ? advanceToNext : revealNext}
          >
            {showingCard ? (
              /* Revealed card */
              <Image
                src={cards[revealedCount].src}
                alt={cards[revealedCount].alt}
                width={736}
                height={1030}
                className="w-full h-full object-contain rounded-xl"
                draggable={false}
                priority
              />
            ) : (
              /* Card back */
              <Image
                src={cardBackSrc}
                alt="Card Back"
                width={736}
                height={1030}
                className="w-full h-full object-contain rounded-xl"
                draggable={false}
                priority
              />
            )}
          </div>
        ) : (
          /* Grid — all cards revealed */
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {cards.map((card, i) => (
              <motion.div
                key={card.alt}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: i * 0.15,
                }}
              >
                <Image
                  src={card.src}
                  alt={card.alt}
                  width={736}
                  height={1030}
                  className="w-full h-auto rounded-lg"
                  draggable={false}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Buttons — during reveal */}
        {!showGrid && (
          <div className="flex flex-col gap-1">
            {/* Next button */}
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
                height={74}
                className="w-full h-auto"
                draggable={false}
              />
            </motion.button>

            {/* Reveal All button */}
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
                height={74}
                className="w-full h-auto"
                draggable={false}
              />
            </motion.button>
          </div>
        )}

        {/* View Collection button — after all revealed */}
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
                  height={74}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </PageBackground>
  );
}
