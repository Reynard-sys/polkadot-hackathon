"use client";
import Image from "next/image";
import { motion } from "motion/react";
import Pack from "./components/pack";
import PageBackground from "@/components/page-background";

export default function Gacha() {
  return (
    <PageBackground>
      {/* ── Mobile layout ── */}
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-24 px-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <Image
            src="/assets/mobile-game-features/mobile-tournaments.svg"
            alt="Mobile Tournaments"
            width={375}
            height={113}
            className="w-full h-auto pointer-events-none"
            draggable={false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          className="flex flex-col gap-3"
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="Standard · 0.1 WND · 10 cards"
            packDesc="16 unique Naruto cards — Common, Rare, Legendary & Mythic. Collect them all!"
            variant="mobile"
            href="/open-packs?series=naruto"
          />
          <Pack
            imageSrc="/assets/packs/one-piece-pack.svg"
            imageAlt="One Piece Pack"
            packName="One Piece Pack"
            packInfo="Premium · 0.25 WND · 20 cards"
            packDesc="16 unique One Piece cards. Premium packs guarantee at least 1 Legendary!"
            variant="mobile"
            href="/open-packs?series=onepiece"
          />
        </motion.div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:pt-28 lg:px-8 lg:gap-6">
        <motion.div
          className="flex flex-col items-center gap-6 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="text-center">
            <h1 className="text-white font-bold text-7xl leading-tight">
              Open a Pack
            </h1>
            <p className="text-white text-base mt-3 max-w-xl mx-auto leading-relaxed">
              Collect 32 unique anime NFT cards across Naruto & One Piece sets.
              Every pull uses provably fair randomness.
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <Image
            src="/assets/desktop-divider.svg"
            alt="Divider"
            width={1440}
            height={80}
            className="hidden lg:block h-auto w-[90%] mx-auto pointer-events-none"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="flex w-full max-w-2xl mt-20 gap-6 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="Standard · 0.001 WND"
            packDesc="16 unique Naruto cards. Common → Mythic rarities. Fair rolls, no duplicates."
            variant="desktop"
            href="/open-packs?series=naruto"
          />
          <Pack
            imageSrc="/assets/packs/one-piece-pack.svg"
            imageAlt="One Piece Pack"
            packName="One Piece Pack"
            packInfo="Premium · 0.0018 WND"
            packDesc="16 unique One Piece cards. Premium packs guarantee 1 Legendary or higher."
            variant="desktop"
            href="/open-packs?series=onepiece"
          />
        </motion.div>
      </div>
    </PageBackground>
  );
}
