"use client";
import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import PageBackground from "@/components/page-background";
import { usePackOpening, PackType, PackSeries } from "@/hooks/usePackOpening";
import { useWallet } from "@/context/wallet-context";

const PACK_BUTTONS: { type: PackType; src: string; alt: string; price: string; cards: number }[] = [
  { type: "standard", src: "/assets/open-10-btn.svg", alt: "Open x10", price: "0.001 WND",  cards: 10 },
  { type: "premium",  src: "/assets/open-20-btn.svg", alt: "Open x20", price: "0.0018 WND", cards: 20 },
  { type: "ultra",    src: "/assets/open-30-btn.svg", alt: "Open x30", price: "0.0025 WND", cards: 30 },
];

const SERIES_META: Record<PackSeries, { name: string; imageSrc: string; imageAlt: string; accent: string }> = {
  naruto:   { name: "Naruto Pack",    imageSrc: "/assets/packs/naruto-pack.svg",    imageAlt: "Naruto Pack",    accent: "text-orange-400" },
  onepiece: { name: "One Piece Pack", imageSrc: "/assets/packs/one-piece-pack.svg", imageAlt: "One Piece Pack", accent: "text-blue-400"   },
};

export default function OpenPacks() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawSeries    = searchParams.get("series");
  const series: PackSeries = rawSeries === "onepiece" ? "onepiece" : "naruto";
  const meta = SERIES_META[series];

  const { wallet, openPicker }                                 = useWallet();
  const { openPack, isOpening, result, error, reset, simMode } = usePackOpening();

  useEffect(() => {
    if (!result) return;
    sessionStorage.setItem("packResult", JSON.stringify({
      tokenIds: result.tokenIds,
      packType: result.packType,
      series:   result.series,
    }));
    router.push("/card-reveal");
  }, [result, router]);

  const handleOpen = useCallback((type: PackType) => {
    // On-chain: require MetaMask
    if (!simMode && !wallet) { openPicker(); return; }
    openPack(type, series);
  }, [simMode, wallet, openPicker, openPack, series]);

  const walletConnected = !!wallet;
  const isMetaMask      = wallet?.type === "metamask";

  return (
    <PageBackground>
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28">

        {/* Pack image */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Image src={meta.imageSrc} alt={meta.imageAlt} width={375} height={450}
            className="w-full h-auto rounded-xl object-cover" draggable={false} />
        </motion.div>

        {/* Pack name + status badges */}
        <motion.div className="flex flex-col gap-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}>
          <div className="flex items-center gap-2">
            <h1 className={`font-bold text-xl leading-tight ${meta.accent}`}>{meta.name}</h1>
            <span className="uppercase text-white text-xs bg-[#8855FF] font-bold px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <p className="text-white/60 text-sm">
            Standard · 0.001&nbsp;|&nbsp;Premium · 0.0018&nbsp;|&nbsp;Ultra · 0.0025 WND
          </p>

          {/* Status row */}
          {simMode && !walletConnected && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-green-400 text-xs">🎲 No wallet needed — open instantly!</p>
              <button onClick={openPicker}
                className="text-xs text-[#8855FF] underline underline-offset-2 cursor-pointer">
                Connect MetaMask ↗
              </button>
            </div>
          )}
          {simMode && walletConnected && isMetaMask && (
            <p className="text-green-400 text-xs mt-1">✅ MetaMask connected — sign to seed your roll!</p>
          )}
          {simMode && walletConnected && !isMetaMask && (
            <p className="text-white/40 text-xs mt-1">🎲 Simulation mode active (connect MetaMask to sign your roll)</p>
          )}
          {!simMode && walletConnected && !isMetaMask && (
            <p className="text-yellow-400 text-xs mt-1">⚠️ MetaMask required for on-chain transactions.</p>
          )}
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
            <button onClick={reset} className="block mt-1 text-xs underline opacity-70">Dismiss</button>
          </motion.div>
        )}

        {/* Loading — show different text based on whether we are signing or just rolling */}
        {isOpening && (
          <motion.p className="text-white/60 text-sm text-center animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {simMode && isMetaMask ? "Sign in MetaMask to reveal your cards… ✍️" : "Rolling your cards… ✨"}
          </motion.p>
        )}

        {/* Open pack buttons */}
        <motion.div className="flex flex-col gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          {PACK_BUTTONS.map((btn, i) => (
            <motion.button key={btn.type}
              className="w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isOpening}
              onClick={() => handleOpen(btn.type)}
              whileHover={isOpening ? {} : { scale: 1.04 }}
              whileTap={isOpening ? {} : { scale: 0.96 }}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.1, scale: { type: "spring", stiffness: 300, damping: 20 } }}
              title={`${btn.cards} cards · ${btn.price}`}>
              <Image src={btn.src} alt={btn.alt} width={375} height={48} className="w-full h-auto" draggable={false} />
            </motion.button>
          ))}
        </motion.div>

        <Link href="/gacha" className="text-white/30 text-xs text-center">← Back to Packs</Link>
      </div>
    </PageBackground>
  );
}
