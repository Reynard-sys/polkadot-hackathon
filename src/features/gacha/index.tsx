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
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="[pack info]"
            variant="mobile"
          />
        </motion.div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:pt-28 lg:px-8 lg:gap-6">
        {/* Heading + divider block */}
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
              Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris
              penatibus varius sagittis mi diam eget penatibus. Ut praesent ut
              auctor turpis cursus id.
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
        {/* Desktop pack card */}
        <motion.div
          className="w-full max-w-sm mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <Pack
            imageSrc="/assets/packs/naruto-pack.svg"
            imageAlt="Naruto Pack"
            packName="Naruto Pack"
            packInfo="[pack info]"
            variant="desktop"
          />
        </motion.div>
      </div>
    </PageBackground>
  );
}
