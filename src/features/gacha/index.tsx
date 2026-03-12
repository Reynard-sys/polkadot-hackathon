"use client";
import Image from "next/image";
import { motion } from "motion/react";
import Pack from "./components/pack";
import PageBackground from "@/components/page-background";

export default function Gacha() {
  return (
    <PageBackground>
      <div className="flex flex-col max-w-sm mx-auto pt-24 px-4 gap-3">
        {/* Header banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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

        {/* Pack card — slides up with a slight delay after banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="[pack info]"
          />
        </motion.div>
      </div>
    </PageBackground>
  );
}
