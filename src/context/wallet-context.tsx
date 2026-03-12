"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

const APP_NAME = "Gacha Polkadot";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WalletType = "metamask" | "polkadot";

export interface ConnectedWallet {
    type: WalletType;
    address: string;
    /** Display name — MetaMask uses "MetaMask", Polkadot uses the account meta name */
    name: string;
    /** Raw Polkadot account (only set when type === "polkadot") */
    polkadotAccount?: InjectedAccountWithMeta;
}

interface WalletContextValue {
    wallet: ConnectedWallet | null;
    isConnecting: boolean;
    error: string | null;
    showPicker: boolean;
    openPicker: () => void;
    closePicker: () => void;
    connectMetaMask: () => Promise<void>;
    connectPolkadot: () => Promise<void>;
    disconnect: () => void;
    truncateAddress: (address: string) => string;
    /** ethers BrowserProvider — only available when type === "metamask" */
    getEthersProvider: () => Promise<import("ethers").BrowserProvider | null>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    const openPicker = useCallback(() => {
        setError(null);
        setShowPicker(true);
    }, []);

    const closePicker = useCallback(() => setShowPicker(false), []);

    // ── MetaMask ──────────────────────────────────────────────────────────────
    const connectMetaMask = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            if (typeof window === "undefined") return;
            const win = window as typeof window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } };
            if (!win.ethereum) {
                setError("MetaMask not found. Please install the MetaMask browser extension.");
                setIsConnecting(false);
                return;
            }
            const accounts = (await win.ethereum.request({ method: "eth_requestAccounts" })) as string[];
            if (!accounts || accounts.length === 0) {
                setError("No MetaMask accounts found.");
                setIsConnecting(false);
                return;
            }
            setWallet({
                type: "metamask",
                address: accounts[0],
                name: "MetaMask",
            });
            setShowPicker(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`MetaMask error: ${msg}`);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // ── Polkadot / SubWallet ──────────────────────────────────────────────────
    const connectPolkadot = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            if (typeof window === "undefined") return;
            const { web3Accounts, web3Enable } = await import("@polkadot/extension-dapp");
            const extensions = await web3Enable(APP_NAME);
            if (extensions.length === 0) {
                setError("No Polkadot wallet found. Please install Polkadot.js, Talisman, or SubWallet.");
                setIsConnecting(false);
                return;
            }
            const accounts = await web3Accounts();
            if (accounts.length === 0) {
                setError("No Polkadot accounts found. Create or import one in your wallet extension.");
                setIsConnecting(false);
                return;
            }
            const acc = accounts[0];
            setWallet({
                type: "polkadot",
                address: acc.address,
                name: acc.meta.name ?? "Unnamed Account",
                polkadotAccount: acc,
            });
            setShowPicker(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Polkadot wallet error: ${msg}`);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // ── Disconnect ────────────────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        setWallet(null);
        setError(null);
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const truncateAddress = (address: string) =>
        address.length > 16
            ? `${address.slice(0, 8)}...${address.slice(-6)}`
            : address;

    const getEthersProvider = useCallback(async () => {
        if (typeof window === "undefined") return null;
        const win = window as typeof window & { ethereum?: unknown };
        if (!win.ethereum) return null;
        const { BrowserProvider } = await import("ethers");
        return new BrowserProvider(win.ethereum as Parameters<typeof BrowserProvider>[0]);
    }, []);

    return (
        <WalletContext.Provider
            value={{
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
                getEthersProvider,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
    return ctx;
}
