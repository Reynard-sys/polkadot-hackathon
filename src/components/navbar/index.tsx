"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

const APP_NAME = "Gacha Polkadot";

export default function Navbar() {
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Deck", href: "/deck" },
        { name: "Gacha", href: "/gacha" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "Tournament", href: "/tournament" },
    ];

    const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Ref for the wallet button area — used to close popover on outside click
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

    const connectWallet = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Request access to the browser extension (e.g. Polkadot.js, Talisman, SubWallet)
            const extensions = await web3Enable(APP_NAME);

            if (extensions.length === 0) {
                setError("No Polkadot wallet extension found. Please install Polkadot.js, Talisman, or SubWallet.");
                setIsConnecting(false);
                return;
            }

            // Retrieve all accounts from the extension
            const accounts = await web3Accounts();

            if (accounts.length === 0) {
                setError("No accounts found. Please create or import an account in your wallet extension.");
                setIsConnecting(false);
                return;
            }

            setAccount(accounts[0]);
        } catch (err) {
            console.error("Wallet connection failed:", err);
            setError("Failed to connect wallet. Please try again.");
        } finally {
            setIsConnecting(false);
        }
    };

    /**
     * Hard logout — clears all wallet state and reloads the page so that
     * web3Enable loses its in-memory session, forcing the extension
     * to re-prompt on the next connect attempt.
     */
    const confirmDisconnect = () => {
        setShowConfirm(false);
        setAccount(null);
        setError(null);
        // Force a full page reload so the extension session is flushed
        window.location.reload();
    };

    /** Truncates a Polkadot address: "5GrwvaEF...keqoYy2T" */
    const truncateAddress = (address: string) =>
        `${address.slice(0, 8)}...${address.slice(-8)}`;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-linear-to-b from-[#2d3548] to-[#030a30]">
            <div className="px-6 lg:px-8 py-3 flex justify-between items-center">
                {/* Left Side: Profile */}
                <div className="flex gap-4 cursor-pointer justify-center items-center">
                    <div className="w-12 h-12 bg-[#8C8C8C] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                            src="/assets/profile-picture.png"
                            alt="Profile Avatar"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
                        Lorem Ipsum
                    </span>
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
