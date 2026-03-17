"use client";

import Image from "next/image";
import { motion } from "motion/react";
import Pack from "./components/pack";
import PageBackground from "@/components/page-background";

export default function Gacha() {
  return (
    <PageBackground>
      <div className="mx-auto flex max-w-sm flex-col gap-3 px-4 pb-12 pt-24 lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <Image
            src="/assets/mobile-game-features/mobile-gacha-system.svg"
            alt="Mobile Gacha System"
            width={375}
            height={113}
            className="pointer-events-none h-auto w-full"
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
            packInfo="Standard - 0.001 WND - 10 cards"
            packDesc="16 unique Naruto cards across Common, Rare, Legendary, and Mythic."
            variant="mobile"
            href="/open-packs?series=naruto"
          />
          <Pack
            imageSrc="/assets/packs/one-piece-pack.svg"
            imageAlt="One Piece Pack"
            packName="One Piece Pack"
            packInfo="Premium - 0.0018 WND - 20 cards"
            packDesc="16 unique One Piece cards. Premium packs guarantee at least 1 Legendary."
            variant="mobile"
            href="/open-packs?series=onepiece"
          />
          <Pack
            imageSrc="/assets/packs/pokemon-pack.svg"
            imageAlt="Pokemon Pack"
            packName="Pokemon Pack"
            packInfo="Ultra - 0.0025 WND - 30 cards"
            packDesc="16 unique Pokemon cards. Ultra packs give the biggest opening and best chase odds."
            variant="mobile"
            href="/open-packs?series=pokemon"
          />
        </motion.div>
      </div>

      <div className="hidden flex-col items-center gap-6 px-8 pb-20 pt-28 lg:flex">
        <motion.div
          className="flex w-full flex-col items-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="text-center">
            <h1 className="text-7xl font-bold leading-tight text-white">
              Open a Pack
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white">
              Collect 48 unique anime NFT cards across Naruto, One Piece, and
              Pokemon sets. Every pull uses provably fair randomness.
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
            className="mx-auto hidden h-auto w-[90%] pointer-events-none lg:block"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="mt-20 flex w-full max-w-5xl flex-wrap justify-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="Standard - 0.001 WND"
            packDesc="16 unique Naruto cards. Common through Mythic rarities with fair rolls."
            variant="desktop"
            href="/open-packs?series=naruto"
          />
          <Pack
            imageSrc="/assets/packs/one-piece-pack.svg"
            imageAlt="One Piece Pack"
            packName="One Piece Pack"
            packInfo="Premium - 0.0018 WND"
            packDesc="16 unique One Piece cards. Premium packs guarantee 1 Legendary or higher."
            variant="desktop"
            href="/open-packs?series=onepiece"
          />
          <Pack
            imageSrc="/assets/packs/pokemon-pack.svg"
            imageAlt="Pokemon Pack"
            packName="Pokemon Pack"
            packInfo="Ultra - 0.0025 WND"
            packDesc="16 unique Pokemon cards. Ultra packs give the biggest pull size and best chase odds."
            variant="desktop"
            href="/open-packs?series=pokemon"
          />
        </motion.div>
      </div>
    </PageBackground>
  );
}
