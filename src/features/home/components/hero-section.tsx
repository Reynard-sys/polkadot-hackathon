"use client";

import Image from "next/image";
import { motion } from "motion/react";
import CardBack from "@/components/card-back";

const cardBackSpread = [
  { rotate: -6, x: -250, y: 20, zIndex: 1 },
  { rotate: -4, x: -180, y: 8, zIndex: 2 },
  { rotate: 4, x: 180, y: 8, zIndex: 2 },
  { rotate: 6, x: 250, y: 20, zIndex: 1 },
];

const cardSpread = [
  { rotate: -2, x: -100, y: 3 },
  { rotate: 0, x: 0, y: 0 },
  { rotate: 2, x: 100, y: 3 },
];

const cardImages = [
  { src: "/assets/left-card.svg", alt: "Left card" },
  { src: "/assets/center-card.svg", alt: "Center card" },
  { src: "/assets/right-card.svg", alt: "Right card" },
];

// Keyframe times: [stacked, spread, hold-spread, unspread, hold-stacked]
const times = [0, 0.2, 0.5, 0.7, 1];
const LOOP_DURATION = 3;
const ENTRANCE_DURATION = 0.7;

export default function HeroSection() {
  return (
    <div className="relative w-full flex items-center justify-center py-20">
      {/* Container fade-in while cards are stacked */}
      <motion.div
        className="flex flex-col items-center gap-10 pt-24"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ENTRANCE_DURATION, ease: "easeOut" }}
      >
        {/* Logo above the card stack */}
        <Image
          src="/logo.svg"
          alt="Logo"
          width={629}
          height={231}
          className="pointer-events-none"
        />

        <p className="text-center text-lg font-bold max-w-xl">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        {/* Card stack */}
        <div className="relative w-[368px] h-[515px]">
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
            }}
          >
            <Image
              src={cardImages[i].src}
              alt={cardImages[i].alt}
              width={368}
              height={515}
              className="pointer-events-none"
              draggable={false}
            />
          </motion.div>
        ))}
        </div>

        {/* Connect Wallet button */}
        <button className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <Image
            src="/assets/connect-wallet-homepage.svg"
            alt="Connect Wallet"
            width={352}
            height={70}
          />
        </button>
      </motion.div>
    </div>
  );
}