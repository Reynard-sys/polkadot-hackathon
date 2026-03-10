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
  const cardStack = (
    <div className="relative w-92 h-128.75">
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
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: "easeInOut", times }}
        >
          <CardBack />
        </motion.div>
      ))}
      {cardSpread.map((spread, i) => (
        <motion.div
          key={`card-${i}`}
          className="absolute inset-0"
          style={{
            zIndex: i === 1 ? cardBackSpread.length + cardSpread.length : cardBackSpread.length + i,
          }}
          animate={{
            rotate: [0, spread.rotate, spread.rotate, 0, 0],
            x: [0, spread.x, spread.x, 0, 0],
            y: [0, spread.y, spread.y, 0, 0],
          }}
          transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: "easeInOut", times }}
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
  );

  return (
    <div className="relative w-full flex items-center justify-center py-12 lg:py-20">
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ENTRANCE_DURATION, ease: "easeOut" }}
      >
        {/* ── Mobile: content inside phone frame ── */}
        <div className="relative w-[calc(100vw-40px)] max-w-110 lg:hidden">
          <Image
            src="/assets/mobile-frame.svg"
            alt=""
            width={379}
            height={602}
            className="w-full h-auto pointer-events-none"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 py-8">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={629}
              height={231}
              className="pointer-events-none"
            />
            <p className="text-center text-xl font-normal leading-5">
              Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus varius sagittis mi diam eget penatibus.
            </p>
            {/* Card stack scaled for mobile frame */}
            <div className="relative w-59.75 h-83.75">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="scale-[0.45] origin-center">
                  {cardStack}
                </div>
              </div>
            </div>
            <button className="flex justify-center items-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/assets/connect-wallet-homepage.svg"
                alt="Connect Wallet"
                width={352}
                height={70}
                className="w-[55%]"
              />
            </button>
          </div>
        </div>

        {/* ── Desktop: normal layout ── */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-10 lg:pt-24">
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
          <div className="relative w-92 h-128.75">
            {cardStack}
          </div>
          <button className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/assets/connect-wallet-homepage.svg"
              alt="Connect Wallet"
              width={352}
              height={70}
              className="w-88"
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}