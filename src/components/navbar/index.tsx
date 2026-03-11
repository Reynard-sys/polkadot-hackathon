"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/context/wallet-context";

export default function Navbar() {
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Deck", href: "/deck" },
        { name: "Gacha", href: "/gacha" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Tournament", href: "/tournament" },
    ];

    const { account, isConnecting, error, connectWallet, confirmDisconnect, truncateAddress } = useWallet();

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


    return (
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-linear-to-b from-[#2d3548] to-[#030a30]">
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
                    {account ? (
                        /* ── Connected: wallet frame + disconnect confirmation popover ── */
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
                                {/* Text overlay — centered inside the frame */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none">
                                    <span className="text-white/70 text-[10px] font-medium leading-tight truncate w-full text-center group-hover:text-white/90 transition-colors">
                                        {account.meta.name ?? "Unnamed Account"}
                                    </span>
                                    <span className="text-white font-mono text-xs leading-tight truncate w-full text-center group-hover:text-white/80 transition-colors">
                                        {truncateAddress(account.address)}
                                    </span>
                                </div>
                            </button>

                            {/* ── Confirmation popover ── */}
                            {showConfirm && (
                                <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d1230] shadow-2xl shadow-black/60 overflow-hidden z-50">
                                    {/* Account info header */}
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                                            Connected as
                                        </p>
                                        <p className="text-white text-sm font-semibold truncate">
                                            {account.meta.name ?? "Unnamed Account"}
                                        </p>
                                        <p className="text-white/50 font-mono text-[10px] truncate">
                                            {truncateAddress(account.address)}
                                        </p>
                                    </div>

                                    {/* Disconnect confirmation */}
                                    <div className="px-4 py-3">
                                        <p className="text-white/70 text-xs mb-3">
                                            Are you sure you want to disconnect?
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={confirmDisconnect}
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

                    ) : (
                        /* ── Not connected: show connect button ── */
                        <div className="flex flex-col items-end gap-1">
                            <button
                                onClick={connectWallet}
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
                                <p className="text-red-400 text-xs max-w-[200px] text-right leading-tight">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    <button className="cursor-pointer text-white shrink-0">
                        <Image
                            src="/assets/hamburger-btn.svg"
                            alt="Menu"
                            width={37}
                            height={37}
                            className="w-full h-full"
                        />
                    </button>
                </div>
            </div>
        </nav>
    );
}
