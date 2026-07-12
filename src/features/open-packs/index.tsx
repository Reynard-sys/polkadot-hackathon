"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import PageBackground from "@/components/page-background";
import { usePackOpening } from "@/hooks/usePackOpening";
import type { PackType, PackSeries } from "@/hooks/usePackOpening";
import { useWallet } from "@/context/wallet-context";
import cardsData from "@/data/cards.json";
import { preloadCardImage } from "@/lib/card-images";

const PACK_BUTTONS: Array<{ type: PackType; src: string; alt: string }> = [
  { type: "standard", src: "/assets/open-10-btn.svg", alt: "Open x10" },
  { type: "premium", src: "/assets/open-20-btn.svg", alt: "Open x20" },
  { type: "ultra", src: "/assets/open-30-btn.svg", alt: "Open x30" },
];

const DESKTOP_BUTTONS: Array<{ type: PackType; src: string; alt: string }> = [
  { type: "standard", src: "/assets/desktop-x10-btn.svg", alt: "Open x10" },
  { type: "premium", src: "/assets/desktop-x20-btn.svg", alt: "Open x20" },
  { type: "ultra", src: "/assets/desktop-x30-btn.svg", alt: "Open x30" },
];

const SERIES_META: Record<
  PackSeries,
  { name: string; imageSrc: string; imageAlt: string; accent: string }
> = {
  naruto: {
    name: "Naruto Pack",
    imageSrc: "/assets/packs/naruto-pack.svg",
    imageAlt: "Naruto Pack",
    accent: "text-orange-400",
  },
  onepiece: {
    name: "One Piece Pack",
    imageSrc: "/assets/packs/one-piece-pack.svg",
    imageAlt: "One Piece Pack",
    accent: "text-blue-400",
  },
  pokemon: {
    name: "Pokemon Pack",
    imageSrc: "/assets/packs/pokemon-pack.svg",
    imageAlt: "Pokemon Pack",
    accent: "text-yellow-400",
  },
};

export default function OpenPacks() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSeries = searchParams.get("series");
  const series: PackSeries =
    rawSeries === "onepiece"
      ? "onepiece"
      : rawSeries === "pokemon"
        ? "pokemon"
        : "naruto";

  const meta = SERIES_META[series];
  const { wallet, openPicker } = useWallet();
  const {
    openPack,
    isOpening,
    result,
    error,
    reset,
    simMode,
    paymentAsset,
    setPaymentAsset,
    packConfig,
    rarityOdds,
  } = usePackOpening();

  useEffect(() => {
    if (!result) return;
    let cancelled = false;

    sessionStorage.setItem(
      "packResult",
      JSON.stringify({
        tokenIds: result.tokenIds,
        packType: result.packType,
        series: result.series,
        demoMode: result.demoMode ?? false,
      }),
    );

    const imageByTokenId = new Map(
      cardsData.map((card) => [Number(card.nftTokenId), card.imageUrl]),
    );
    const imageUrls = [...new Set(
      result.tokenIds
        .map((tokenId) => imageByTokenId.get(tokenId))
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
    )];

    // Warm the first reveal and start the next two while the opening status is visible.
    const firstImage = imageUrls[0] ? preloadCardImage(imageUrls[0]) : Promise.resolve();
    imageUrls.slice(1, 3).forEach((imageUrl) => void preloadCardImage(imageUrl));

    void firstImage.then(() => {
      if (!cancelled) router.push("/card-reveal");
    });

    return () => {
      cancelled = true;
    };
  }, [result, router]);

  const handleOpen = useCallback(
    (type: PackType) => {
      if (!simMode && !wallet) {
        openPicker();
        return;
      }
      void openPack(type, series);
    },
    [openPack, openPicker, series, simMode, wallet],
  );

  const connectedWalletLabel = wallet?.name ?? "Freighter";
  const showOpeningLoader = isOpening || Boolean(result);

  return (
    <PageBackground>
      {showOpeningLoader ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#030718]/82 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
          aria-label="Opening card pack"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="relative h-40 w-28"
              animate={{
                y: [0, -10, 0],
                rotate: [-3, 3, -3],
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-xl bg-[#8855FF]/35 blur-2xl" />
              <Image
                src="/assets/card-back.svg"
                alt=""
                fill
                sizes="112px"
                className="relative object-contain drop-shadow-[0_0_24px_rgba(136,85,255,0.65)]"
                priority
              />
            </motion.div>
            <div className="mt-6 flex items-center gap-2">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="h-2 w-2 rounded-full bg-[#9d78ff]"
                  animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.15 }}
                />
              ))}
            </div>
            <p className="mt-4 text-lg font-bold text-white">
              {result ? "Preparing your reveal..." : "Opening your pack..."}
            </p>
            <p className="mt-1 text-sm text-white/55">Please keep this page open</p>
          </div>
        </motion.div>
      ) : null}
      <div className="flex flex-col lg:hidden max-w-sm mx-auto pt-20 px-4 gap-5 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={meta.imageSrc}
            alt={meta.imageAlt}
            width={375}
            height={450}
            className="w-full h-auto rounded-xl object-cover"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="flex flex-col gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <h1 className={`font-bold text-xl leading-tight ${meta.accent}`}>
              {meta.name}
            </h1>
            <span className="uppercase text-white text-xs bg-[#8855FF] font-bold px-2 py-0.5 rounded-full">
              {simMode ? "DEMO" : "STELLAR"}
            </span>
          </div>
          <p className="text-white/60 text-sm">
            {simMode
              ? "Open demo packs now. Stellar checkout appears automatically once configured."
              : "Pay with XLM or Stellar USDC and reveal backend-owned cards."}
          </p>
        </motion.div>

        <div className="rounded-2xl border border-white/10 bg-linear-to-b from-[#2D3548] to-[#030A30] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8db8ff]">
            Checkout
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["XLM", "USDC"] as const).map((asset) => (
              <button
                key={asset}
                type="button"
                onClick={() => setPaymentAsset(asset)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  paymentAsset === asset
                    ? "border-[#6ea8ff] bg-[#12326e] text-white"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {asset}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            {(["standard", "premium", "ultra"] as PackType[]).map((type) => (
              <div key={type} className="rounded-xl border border-white/8 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold capitalize">{type} Pack</p>
                    <p className="text-white/60 text-xs">
                      {packConfig[type].cards} cards • {packConfig[type].guarantee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {paymentAsset === "XLM" ? packConfig[type].xlm : packConfig[type].usdc} {paymentAsset}
                    </p>
                    <p className="text-xs text-white/60">≈ PHP {packConfig[type].php}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-3 text-xs text-white/72">
            <p className="font-semibold text-white">Pack odds</p>
            <div className="mt-2 grid grid-cols-2 gap-y-1">
              {rarityOdds.map((item) => (
                <span key={item.rarity}>
                  {item.rarity}: {item.weight}
                </span>
              ))}
            </div>
            <p className="mt-2">
              Duplicate cap per pack: Standard {packConfig.standard.duplicateCap},
              Premium {packConfig.premium.duplicateCap}, Ultra {packConfig.ultra.duplicateCap}.
            </p>
          </div>
        </div>

        {!simMode && !wallet ? (
          <button
            onClick={openPicker}
            className="text-xs text-[#8855FF] underline underline-offset-2 cursor-pointer"
          >
            Connect Freighter to continue
          </button>
        ) : wallet ? (
          <p className="text-green-400 text-xs">
            {connectedWalletLabel} connected {simMode ? "for seeded demo rolls." : "for Stellar checkout."}
          </p>
        ) : null}

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm"
          >
            {error}
            <button onClick={reset} className="block mt-1 text-xs underline opacity-70">
              Dismiss
            </button>
          </motion.div>
        ) : null}

        {isOpening ? (
          <motion.p
            className="text-white/60 text-sm text-center animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {simMode
              ? "Rolling a demo pack..."
              : `Preparing ${paymentAsset} checkout in ${connectedWalletLabel}...`}
          </motion.p>
        ) : null}

        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {PACK_BUTTONS.map((button, index) => (
            <motion.button
              key={button.type}
              className="w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isOpening}
              onClick={() => handleOpen(button.type)}
              whileHover={isOpening ? {} : { scale: 1.04 }}
              whileTap={isOpening ? {} : { scale: 0.96 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.35 + index * 0.1,
                scale: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              <Image
                src={button.src}
                alt={button.alt}
                width={375}
                height={48}
                className="w-full h-auto"
                draggable={false}
              />
            </motion.button>
          ))}
        </motion.div>

        <Link href="/gacha" className="text-white/30 text-xs text-center">
          Back to packs
        </Link>
      </div>

      <div className="hidden lg:flex flex-col items-center w-full max-w-4xl mx-auto px-8 pt-24 pb-20 gap-5">
        <motion.div
          className="bg-linear-to-b from-[#2D3548] to-[#030A30] border border-white/10 rounded-2xl p-6 flex justify-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src={meta.imageSrc}
            alt={meta.imageAlt}
            width={375}
            height={450}
            className="w-xs h-auto rounded-xl object-cover"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="bg-linear-to-b from-[#2D3548] to-[#030A30] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`font-bold text-lg leading-tight ${meta.accent}`}>
                {meta.name}
              </h1>
              <p className="text-white/60 text-sm">
                Transparent pack odds, PHP pricing, and Stellar checkout.
              </p>
            </div>
            <span className="uppercase text-white text-xs leading-4 bg-[#8855FF] font-bold px-2 py-0.5 rounded-full">
              {simMode ? "DEMO" : "STELLAR"}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-white/10 bg-[#0b1024] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8db8ff]">
                Payment Asset
              </p>
              <div className="mt-3 flex gap-2">
                {(["XLM", "USDC"] as const).map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => setPaymentAsset(asset)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      paymentAsset === asset
                        ? "border-[#6ea8ff] bg-[#12326e] text-white"
                        : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/60">
                {simMode
                  ? "Demo mode is active until Stellar env vars are configured."
                  : wallet
                    ? `${connectedWalletLabel} is connected for paid checkout.`
                    : "Connect Freighter to pay and receive backend-owned cards."}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b1024] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8db8ff]">
                Odds
              </p>
              <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-white/80">
                {rarityOdds.map((item) => (
                  <span key={item.rarity}>
                    {item.rarity}: {item.weight}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/60">
                Duplicate cap per pack: 1 / 2 / 3. Each pack shows PHP-equivalent pricing before payment.
              </p>
            </div>
          </div>

          {error ? (
            <div className="bg-red-900/40 border border-red-500/40 rounded-lg px-4 py-2 text-red-300 text-sm flex items-center justify-between">
              {error}
              <button onClick={reset} className="text-xs underline opacity-70 ml-2">
                Dismiss
              </button>
            </div>
          ) : null}

          {isOpening ? (
            <p className="text-white/60 text-sm text-center animate-pulse">
              {simMode
                ? "Rolling a demo pack..."
                : `Preparing ${paymentAsset} checkout in ${connectedWalletLabel}...`}
            </p>
          ) : null}

          <div className="grid gap-3">
            {(["standard", "premium", "ultra"] as PackType[]).map((type) => (
              <div
                key={type}
                className="rounded-xl border border-white/10 bg-[#0b1024] px-4 py-3 text-sm text-white/78"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold capitalize text-white">{type} Pack</p>
                    <p className="text-xs text-white/60">
                      {packConfig[type].cards} cards • {packConfig[type].guarantee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {paymentAsset === "XLM" ? packConfig[type].xlm : packConfig[type].usdc} {paymentAsset}
                    </p>
                    <p className="text-xs text-white/60">≈ PHP {packConfig[type].php}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {DESKTOP_BUTTONS.map((button, index) => (
              <motion.button
                key={button.type}
                className="w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={isOpening}
                onClick={() => handleOpen(button.type)}
                whileHover={isOpening ? {} : { scale: 1.02 }}
                whileTap={isOpening ? {} : { scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.25 + index * 0.1,
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
                <Image
                  src={button.src}
                  alt={button.alt}
                  width={962}
                  height={74}
                  className="w-full h-auto"
                  draggable={false}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </PageBackground>
  );
}
