"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DesktopHamburgerMenu, MobileHamburgerMenu } from "@/components/hamburger-menu";
import { useWallet } from "@/context/wallet-context";

export default function Navbar() {
    const pathname = usePathname();
    const hideOnMobile = pathname === "/inventory";

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Deck", href: "/deck" },
        { name: "Gacha", href: "/gacha" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Tournament", href: "/tournament" },
    ];

    const {
        wallet,
        isConnecting,
        error,
        showPicker,
        openPicker,
        closePicker,
        connectMetaMask,
        connectPolkadot,
        disconnect,
        truncateAddress,
    } = useWallet();

    const [showConfirm, setShowConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const walletRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close disconnect popover on outside click
    useEffect(() => {
        if (!showConfirm) return;
        const handler = (e: MouseEvent) => {
            if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
                setShowConfirm(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showConfirm]);

    // Close picker on outside click
    useEffect(() => {
        if (!showPicker) return;
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                closePicker();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showPicker, closePicker]);

    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showMenu]);

    useEffect(() => {
        if (!showMenu) return;
        if (!window.matchMedia("(max-width: 1023px)").matches) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showMenu]);

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 w-full bg-linear-to-b from-[#2d3548] to-[#030a30] ${hideOnMobile ? "hidden md:block" : ""}`}>
                <div className="px-6 lg:px-8 py-3 flex justify-between items-center">
                    {/* Left Side: Logo */}
                    <div className="flex items-center cursor-pointer">
                        <Image
                            src="/logo.svg"
                            alt="Gacha Logo"
                            width={120}
                            height={40}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>

                    {/* Center: Navigation Links */}
                    <div className="hidden lg:flex justify-center items-center gap-8 xl:gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-white hover:text-white/80 font-bold text-lg leading-7 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side: Wallet & Menu */}
                    <div className="flex gap-3 sm:gap-6 items-center">
                        {wallet ? (
                            /* ── Connected: wallet frame + disconnect popover ── */
                            <div ref={walletRef} className="relative flex-shrink-0">
                                <button
                                    onClick={() => setShowConfirm((prev) => !prev)}
                                    title="Click to manage wallet"
                                    className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 group flex-shrink-0"
                                    style={{ width: 180, minWidth: 180, height: 47, minHeight: 47 }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/walletFrame.svg"
                                        alt="Wallet Frame"
                                        width={180}
                                        height={47}
                                        className="absolute inset-0 w-full h-full"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none">
                                        <span className="text-white/70 text-[10px] font-medium leading-tight truncate w-full text-center group-hover:text-white/90 transition-colors flex items-center justify-center gap-1">
                                            {wallet.type === "metamask" ? (
                                                <span>🦊 {wallet.name}</span>
                                            ) : (
                                                <span>🔵 {wallet.name}</span>
                                            )}
                                        </span>
                                        <span className="text-white font-mono text-xs leading-tight truncate w-full text-center group-hover:text-white/80 transition-colors">
                                            {truncateAddress(wallet.address)}
                                        </span>
                                    </div>
                                </button>

                                {/* ── Disconnect confirmation popover ── */}
                                {showConfirm && (
                                    <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d1230] shadow-2xl shadow-black/60 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                                                Connected via {wallet.type === "metamask" ? "MetaMask 🦊" : "Polkadot 🔵"}
                                            </p>
                                            <p className="text-white text-sm font-semibold truncate">{wallet.name}</p>
                                            <p className="text-white/50 font-mono text-[10px] truncate">{truncateAddress(wallet.address)}</p>
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
                                                    className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        ) : (
                            /* ── Not connected: connect button ── */
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    onClick={openPicker}
                                    disabled={isConnecting}
                                    className="cursor-pointer relative transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Image
                                        src="/assets/connect-wallet-btn.svg"
                                        alt="Connect Wallet"
                                        width={181}
                                        height={46}
                                        className="w-full"
                                        priority
                                    />
                                    {isConnecting && (
                                        <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                                            Connecting…
                                        </span>
                                    )}
                                </button>
                                {error && (
                                    <p className="text-red-400 text-xs max-w-[200px] text-right leading-tight">{error}</p>
                                )}
                            </div>
                        )}

                        <div ref={menuRef} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowMenu((prev) => !prev)}
                                className="cursor-pointer text-white shrink-0"
                                aria-label={showMenu ? "Close menu" : "Open menu"}
                                aria-expanded={showMenu}
                            >
                                <Image
                                    src="/assets/hamburger-btn.svg"
                                    alt="Menu"
                                    width={37}
                                    height={37}
                                    className="w-full h-full"
                                />
                            </button>
                            {showMenu && (
                                <>
                                    <div className="hidden lg:block">
                                        <DesktopHamburgerMenu onClose={() => setShowMenu(false)} />
                                    </div>
                                    <MobileHamburgerMenu onClose={() => setShowMenu(false)} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Wallet Picker Modal ── */}
            {showPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div
                        ref={pickerRef}
                        className="bg-[#0d1230] border border-white/10 rounded-2xl shadow-2xl w-80 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-white font-bold text-lg">Connect Wallet</h2>
                                <p className="text-white/50 text-xs mt-0.5">Choose your wallet provider</p>
                            </div>
                            <button
                                onClick={closePicker}
                                className="text-white/40 hover:text-white transition-colors text-xl leading-none cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Wallet Options */}
                        <div className="p-4 flex flex-col gap-3">
                            {/* MetaMask */}
                            <button
                                onClick={connectMetaMask}
                                disabled={isConnecting}
                                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/50 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-3xl select-none">🦊</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white font-semibold text-sm group-hover:text-orange-300 transition-colors">MetaMask</span>
                                    <span className="text-white/40 text-xs">EVM / Ethereum compatible</span>
                                </div>
                            </button>

                            {/* SubWallet / Polkadot.js */}
                            <button
                                onClick={connectPolkadot}
                                disabled={isConnecting}
                                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/50 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-3xl select-none">🔵</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white font-semibold text-sm group-hover:text-pink-300 transition-colors">SubWallet / Polkadot.js</span>
                                    <span className="text-white/40 text-xs">Native Polkadot wallets</span>
                                </div>
                            </button>

                            {/* Error */}
                            {error && (
                                <p className="text-red-400 text-xs text-center mt-1 leading-tight px-2">{error}</p>
                            )}

                            {isConnecting && (
                                <p className="text-white/50 text-xs text-center animate-pulse">Connecting…</p>
                            )}
                        </div>

                        <p className="text-white/20 text-[10px] text-center pb-4 px-6">
                            By connecting, you agree to the terms of this dApp.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
