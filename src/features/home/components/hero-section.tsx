"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import CardBack from "@/components/card-back";
import { useWallet } from "@/context/wallet-context";

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
  { src: "/assets/left-card.webp", alt: "Left card" },
  { src: "/assets/center-card.webp", alt: "Center card" },
  { src: "/assets/right-card.webp", alt: "Right card" },
];

// Keyframe times: [stacked, spread, hold-spread, unspread, hold-stacked]
const times = [0, 0.2, 0.5, 0.7, 1];
const LOOP_DURATION = 3;
const ENTRANCE_DURATION = 0.7;

/**
 * Self-contained wallet button.
 * - Reads shared account state from WalletContext (so both hero + navbar reflect the same wallet).
 * - Owns its own showConfirm + walletRef so each instance's modal is independent.
 * - Always renders at the fixed width/height passed in — size never changes on connect.
 */
function WalletButton({
  width,
  height,
  connectSrc,
  connectAlt = "Connect Wallet",
  textSizeAccount = "text-[10px]",
  textSizeAddress = "text-xs",
  px = "px-6",
}: {
  width: number;
  height: number;
  connectSrc: string;
  connectAlt?: string;
  textSizeAccount?: string;
  textSizeAddress?: string;
  px?: string;
}) {
  const { wallet, isConnecting, error, openPicker, disconnect, truncateAddress } =
    useWallet();
  const [showConfirm, setShowConfirm] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showConfirm) return;
    const handleOutside = (e: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showConfirm]);

  if (wallet) {
    return (
      <div ref={walletRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowConfirm((p) => !p)}
          title="Click to manage wallet"
          className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
          style={{ width, minWidth: width, height, minHeight: height }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/walletFrame.svg"
            alt="Wallet Frame"
            width={width}
            height={height}
            className="absolute inset-0 w-full h-full"
          />
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${px} pointer-events-none`}
          >
            <span
              className={`text-white/70 ${textSizeAccount} font-medium leading-tight truncate w-full text-center group-hover:text-white/90 transition-colors`}
            >
              {wallet.type === "metamask" ? "🦊 " : "🔵 "}{wallet.name}
            </span>
            <span
              className={`text-white font-mono ${textSizeAddress} leading-tight truncate w-full text-center group-hover:text-white/80 transition-colors`}
            >
              {truncateAddress(wallet.address)}
            </span>
          </div>
        </button>

        {/* Disconnect confirmation popover */}
        {showConfirm && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d1230] shadow-2xl shadow-black/60 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                Connected via {wallet.type === "metamask" ? "MetaMask 🦊" : "Polkadot 🔵"}
              </p>
              <p className="text-white text-sm font-semibold truncate">{wallet.name}</p>
              <p className="text-white/50 font-mono text-[10px] truncate">
                {truncateAddress(wallet.address)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-white/70 text-xs mb-3">Disconnect your wallet?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { disconnect(); setShowConfirm(false); }}
                  className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/5 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={openPicker}
        disabled={isConnecting}
        className="flex justify-center items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed relative"
      >
        <Image src={connectSrc} alt={connectAlt} width={width} height={height} />
        {isConnecting && (
          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
            Connecting…
          </span>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-xs max-w-[260px] text-center leading-tight">{error}</p>
      )}
    </div>
  );
}


export default function HeroSection() {
  const cardStack = (
    <div className="relative w-92 h-128.75">
      {cardBackSpread.map((spread, i) => (
        <motion.div
          key={`back-${i}`}
          className="absolute inset-0"
          style={{ zIndex: spread.zIndex, willChange: "transform" }}
          animate={{
            rotate: [0, spread.rotate, spread.rotate, 0, 0],
            x: [0, spread.x, spread.x, 0, 0],
            y: [0, spread.y, spread.y, 0, 0],
          }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            ease: "easeInOut",
            times,
          }}
        >
          <CardBack />
        </motion.div>
      ))}
      {cardSpread.map((spread, i) => (
        <motion.div
          key={`card-${i}`}
          className="absolute inset-0"
          style={{
            zIndex:
              i === 1
                ? cardBackSpread.length + cardSpread.length
                : cardBackSpread.length + i,
            willChange: "transform",
          }}
          animate={{
            rotate: [0, spread.rotate, spread.rotate, 0, 0],
            x: [0, spread.x, spread.x, 0, 0],
            y: [0, spread.y, spread.y, 0, 0],
          }}
          transition={{
            duration: LOOP_DURATION,
            repeat: Infinity,
            ease: "easeInOut",
            times,
          }}
        >
          <Image
            src={cardImages[i].src}
            alt={cardImages[i].alt}
            width={736}
            height={1030}
            priority
            className="pointer-events-none"
            draggable={false}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full flex items-center justify-center lg:py-10">
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ENTRANCE_DURATION, ease: "easeOut" }}
      >
        {/* ── Mobile: content inside phone frame ── */}
        <div className="relative w-[calc(100vw-40px)] pt-24 max-w-110 lg:hidden">
          <Image
            src="/assets/mobile-frame.svg"
            alt=""
            width={379}
            height={602}
            className="w-full h-full pointer-events-none"
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
              Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris
              penatibus varius sagittis mi diam eget penatibus.
            </p>
            {/* Card stack scaled for mobile frame */}
            <div className="relative w-60 h-60">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="scale-[0.45] origin-center">{cardStack}</div>
              </div>
            </div>
            <WalletButton
              width={230}
              height={47}
              connectSrc="/assets/connect-wallet-btn.svg"
            />
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="relative w-92 h-128.75">{cardStack}</div>
          <WalletButton
            width={352}
            height={70}
            connectSrc="/assets/connect-wallet-homepage.svg"
            textSizeAccount="text-xs"
            textSizeAddress="text-sm"
            px="px-8"
          />
        </div>
      </motion.div>
    </div>
  );
}
