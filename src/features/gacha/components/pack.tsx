"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

interface PackProps {
  imageSrc: string;
  imageAlt?: string;
  packName: string;
  packInfo: string;
  packDesc?: string;
  variant?: "mobile" | "desktop";
  href?: string;
}

export default function Pack({
  imageSrc,
  imageAlt = "Pack",
  packName,
  packInfo,
  packDesc,
  variant = "mobile",
  href = "/open-packs",
}: PackProps) {
  /* ── Desktop: image fills card top, text section below ── */
  if (variant === "desktop") {
    return (
      <div
        className="flex flex-col rounded-2xl overflow-hidden w-67.5 shrink-0 p-6"
        style={{ background: "linear-gradient(to bottom, #2d3548, #030a30)" }}
      >
        {/* Full-bleed image */}
        <div className="relative w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={270}
            height={320}
            className="w-full h-auto object-cover mb-4 "
          />
          <span className="uppercase absolute -top-0.75 -right-0.75 text-white text-sm leading-5 bg-[#8855FF] font-bold px-2 py-0.5 rounded-full">
            NEW
          </span>
        </div>

        {/* Text + button */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-white font-bold text-lg leading-tight">
            {packName}
          </h2>
          <p className="text-white/60 text-sm">{packInfo}</p>
          <p className="text-white/50 text-sm leading-relaxed mt-1">
            {packDesc ??
              "Open packs to collect unique anime NFT cards on Westend AssetHub."}
          </p>

          <Link href={href}>
            <motion.button
              className="flex justify-center items-center mt-4 w-full cursor-pointer"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              animate={{
                filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"],
              }}
              transition={{
                filter: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              <Image
                src="/assets/desktop-open-pack-btn.svg"
                alt="Open Pack"
                width={278}
                height={44}
                className="h-auto w-full"
              />
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Mobile: two-column row ── */
  return (
    <div
      className="flex flex-row gap-5.25 px-4 py-6.25 rounded-xl"
      style={{ background: "linear-gradient(to bottom, #2d3548, #030a30)" }}
    >
      {/* Left — pack image with NEW badge */}
      <div className="relative shrink-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={140}
          height={200}
          className="object-contain"
        />
        <span className="uppercase absolute top-[-2] right-[-2] text-white text-sm leading-5 bg-[#8855FF] font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      </div>

      {/* Right — pack details */}
      <div className="flex flex-col flex-1">
        <h2 className="text-white font-bold text-lg leading-tight">
          {packName}
        </h2>
        <p className="text-white/60 text-sm mt-1">{packInfo}</p>
        <p className="text-white/50 text-sm mt-3 leading-relaxed">
          {packDesc ??
            "Open packs to collect unique anime NFT cards on Westend AssetHub."}
        </p>
        <Link href={href}>
          <button className="flex justify-center items-center pt-4">
            <Image
              src="/assets/open-pack-btn.svg"
              alt="Open Pack"
              width={160}
              height={47}
              className="h-auto w-full"
            />
          </button>
        </Link>
      </div>
    </div>
  );
}
