"use client";

import { createContext, useContext, useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

const APP_NAME = "Gacha Polkadot";

interface WalletContextValue {
    account: InjectedAccountWithMeta | null;
    isConnecting: boolean;
    error: string | null;
    connectWallet: () => Promise<void>;
    confirmDisconnect: () => void;
    truncateAddress: (address: string) => string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const extensions = await web3Enable(APP_NAME);
            if (extensions.length === 0) {
                setError("No Polkadot wallet extension found. Please install Polkadot.js, Talisman, or SubWallet.");
                setIsConnecting(false);
                return;
            }
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

    const confirmDisconnect = () => {
        setAccount(null);
        setError(null);
        window.location.reload();
    };

    const truncateAddress = (address: string) =>
        `${address.slice(0, 8)}...${address.slice(-8)}`;

    return (
        <WalletContext.Provider
            value={{ account, isConnecting, error, connectWallet, confirmDisconnect, truncateAddress }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
    return ctx;
}
