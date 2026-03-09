"use client";

import { motion } from "motion/react";
import CardBack from "@/components/card-back";
import Card from "@/components/card";

const cardBackSpread = [
  { rotate: -10, x: -160, y: 20, zIndex: 1 },
  { rotate: -5, x: -120, y: 8, zIndex: 2 },
  { rotate: 5, x: 120, y: 8, zIndex: 2 },
  { rotate: 10, x: 160, y: 20, zIndex: 1 },
];

const cardSpread = [
  { rotate: -4, x: -80, y: 3 },
  { rotate: 0, x: 0, y: -5 },
  { rotate: 4, x: 80, y: 3 },
];

const sampleCards = [
  {
    rank: 1,
    power: 95,
    cardImage: "/assets/placeholder-image.png",
    tag: "tag",
    subtitle: "Lorem Ipsum",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    packName: "Lorem Ipsum",
    title: "Lorem Ipsum",
    ctaLabel: "Lorem Ipsum",
  },
  {
    rank: 2,
    power: 88,
    cardImage: "/assets/placeholder-image.png",
    tag: "tag",
    subtitle: "Lorem Ipsum",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    packName: "Lorem Ipsum",
    title: "Lorem Ipsum",
    ctaLabel: "Lorem Ipsum",
  },
  {
    rank: 3,
    power: 82,
    cardImage: "/assets/placeholder-image.png",
    tag: "tag",
    subtitle: "Lorem Ipsum",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    packName: "Lorem Ipsum",
    title: "Lorem Ipsum",
    ctaLabel: "Lorem Ipsum",
  },
];

// Keyframe times: [stacked, spread, hold-spread, unspread, hold-stacked]
const times = [0, 0.2, 0.5, 0.7, 1];
const LOOP_DURATION = 5;
const ENTRANCE_DURATION = 0.7;

export default function HeroSection() {
  return (
    <div className="relative w-full flex items-center justify-center py-20">
      {/* Container fade-in while cards are stacked */}
      <motion.div
        className="relative w-[368px] h-[515px]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ENTRANCE_DURATION, ease: "easeOut" }}
      >
        {/* 4 Card Backs (bottom layer) */}
        {cardBackSpread.map((spread, i) => (
          <motion.div
            key={`back-${i}`}
            className="absolute inset-0"
            style={{ zIndex: spread.zIndex }}
            animate={{
              rotate: [0, spread.rotate, spread.rotate, 0, 0],
              x: [0, spread.x, spread.x, 0, 0],
              y: [0, spread.y, spread.y, 0, 0],
            }}
            transition={{
              duration: LOOP_DURATION,
              repeat: Infinity,
              ease: "easeInOut",
              times,
              delay: ENTRANCE_DURATION + 0.05 * i,
            }}
          >
            <CardBack />
          </motion.div>
        ))}

        {/* 3 Cards (top layer) — middle card stays centered */}
        {cardSpread.map((spread, i) => (
          <motion.div
            key={`card-${i}`}
            className="absolute inset-0"
            style={{
              zIndex:
                i === 1
                  ? cardBackSpread.length + cardSpread.length
                  : cardBackSpread.length + i,
            }}
            animate={{
              rotate: [0, spread.rotate, spread.rotate, 0, 0],
              x: [0, spread.x, spread.x, 0, 0],
              y: [0, spread.y, spread.y, 0, 0],
            }}
            transition={{
              duration: LOOP_DURATION,
              repeat: Infinity,
              ease: "easeInOut",
              times,
              delay: ENTRANCE_DURATION + 0.2 + 0.06 * i,
            }}
          >
            <Card {...sampleCards[i]} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}