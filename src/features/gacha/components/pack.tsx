"use client";
import Image from "next/image";
import { motion } from "motion/react";

interface PackProps {
  imageSrc: string;
  imageAlt?: string;
  packName: string;
  packInfo: string;
  variant?: "mobile" | "desktop";
}

export default function Pack({
  imageSrc,
  imageAlt = "Pack",
  packName,
  packInfo,
  variant = "mobile",
}: PackProps) {
  const isDesktop = variant === "desktop";

  return (
    <div
      className={`flex rounded-xl ${isDesktop ? "flex-col items-center gap-6 p-6 w-67.75" : "flex-row gap-5.25 px-4 py-6.25"}`}
      style={{
        background: "linear-gradient(to bottom, #2d3548, #030a30)",
      }}
    >
      {/* Pack image with NEW badge */}
      <div
        className={`relative shrink-0 ${isDesktop ? "flex justify-center" : ""}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={isDesktop ? 220 : 140}
          height={isDesktop ? 310 : 200}
          className="object-cover"
        />
        <span className="uppercase absolute top-[-2] right-[-2] text-white text-sm leading-5 bg-[#8855FF] font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      </div>

      {/* Pack details */}
      <div
        className={`flex flex-col ${isDesktop ? "items-start text-start flex-1" : "flex-1"}`}
      >
        <h2
          className={`text-white font-bold leading-tight ${isDesktop ? "text-2xl" : "text-lg"}`}
        >
          {packName}
        </h2>

        <p className={`text-white/60 text-sm mt-1 ${isDesktop ? "mt-2" : ""}`}>
          {packInfo}
        </p>

        <p
          className={`text-white/50 text-sm leading-relaxed ${isDesktop ? "mt-4 max-w-xs w-fit" : "mt-3"}`}
        >
          Lorem ipsum dolor sit amet consectetur. Lorem ipsum dolor sit amet
          consectetur consectetur.
        </p>

        {/* Open Pack button */}
        {isDesktop ? (
          <motion.button
            className="flex justify-center items-center mt-6 mx-auto cursor-pointer"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            animate={{ filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }}
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
        ) : (
          <button className="flex justify-center items-center pt-4">
            <Image
              src="/assets/open-pack-btn.svg"
              alt="Open Pack"
              width={160}
              height={47}
              className="h-auto w-full"
            />
          </button>
        )}
      </div>
    </div>
  );
}
