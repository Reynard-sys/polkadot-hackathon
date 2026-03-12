"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import PageBackground from "@/components/page-background";

const openButtons = [
  { src: "/assets/open-10-btn.svg", alt: "Open x10" },
  { src: "/assets/open-20-btn.svg", alt: "Open x20" },
  { src: "/assets/open-30-btn.svg", alt: "Open x30" },
];

export default function OpenPacks() {
  return (
    <PageBackground>
      {/* ── Mobile layout ── */}
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28">
        {/* Pack image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src="/assets/packs/one-piece-pack.svg"
            alt="One Piece Pack"
            width={375}
            height={450}
            className="w-full h-auto rounded-xl object-cover"
            draggable={false}
          />
        </motion.div>

        {/* Pack name + NEW tag + set info */}
        <motion.div
          className="flex flex-col gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold text-xl leading-tight">
              One Piece Pack
            </h1>
            <span className="uppercase text-white text-xs leading-4 bg-[#8855FF] font-bold px-2 py-0.5 rounded-full">
              NEW
            </span>
          </div>
          <p className="text-white/60 text-sm">[Set info]</p>
        </motion.div>

        {/* Open pack buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          {openButtons.map((btn, i) => {
            const button = (
              <motion.button
                key={btn.alt}
                className="w-full cursor-pointer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.35 + i * 0.1,
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
                <Image
                  src={btn.src}
                  alt={btn.alt}
                  width={375}
                  height={48}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>
            );

            // Only x10 navigates to card-reveal for now
            if (i === 0) {
              return (
                <Link key={btn.alt} href="/card-reveal">
                  {button}
                </Link>
              );
            }

            return button;
          })}
        </motion.div>
      </div>
    </PageBackground>
  );
}
