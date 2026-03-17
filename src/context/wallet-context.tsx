"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

const APP_NAME = "Gacha Polkadot";

export type WalletType = "metamask" | "polkadot";
type EvmProviderPreference = "auto" | "metamask" | "subwallet";

type InjectedEvmProvider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    isMetaMask?: boolean;
    isSubWallet?: boolean;
    providers?: InjectedEvmProvider[];
};

export interface ConnectedWallet {
    type: WalletType;
    address: string;
    /** Display name — MetaMask uses "MetaMask", Polkadot uses the account meta name */
    name: string;
    evmProviderPreference?: Exclude<EvmProviderPreference, "auto">;
    /** Raw Polkadot account (only set when type === "polkadot") */
    polkadotAccount?: InjectedAccountWithMeta;
    polkadotSource?: string;
}

interface WalletContextValue {
    wallet: ConnectedWallet | null;
    isConnecting: boolean;
    error: string | null;
    showPicker: boolean;
    openPicker: () => void;
    closePicker: () => void;
    connectMetaMask: () => Promise<void>;
    connectSubWallet: () => Promise<void>;
    connectPolkadot: () => Promise<void>;
    disconnect: () => void;
    truncateAddress: (address: string) => string;
    /** ethers BrowserProvider — only available when type === "metamask" */
    getEthersProvider: (
        preference?: EvmProviderPreference,
    ) => Promise<import("ethers").BrowserProvider | null>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function getInjectedProviders(
    win: typeof window & { ethereum?: InjectedEvmProvider },
) {
    const rootProvider = win.ethereum;
    if (!rootProvider) return [] as InjectedEvmProvider[];

    const providers = Array.isArray(rootProvider.providers)
        ? rootProvider.providers
        : [rootProvider];

    return providers.filter(
        (provider, index) => providers.indexOf(provider) === index,
    );
}

function findInjectedProvider(
    preference: EvmProviderPreference,
    win: typeof window & { ethereum?: InjectedEvmProvider },
) {
    const providers = getInjectedProviders(win);
    const rootProvider = win.ethereum ?? null;

    if (preference === "metamask") {
        return (
            providers.find((provider) => provider.isMetaMask) ??
            rootProvider ??
            null
        );
    }

    if (preference === "subwallet") {
        const taggedProvider =
            providers.find((provider) => provider.isSubWallet) ?? null;
        if (taggedProvider) {
            return taggedProvider;
        }

        if (rootProvider && !rootProvider.isMetaMask) {
            return rootProvider;
        }

        if (providers.length === 1 && !providers[0].isMetaMask) {
            return providers[0];
        }

        return null;
    }

    return rootProvider ?? providers[0] ?? null;
}

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

    const connectInjectedEvmWallet = useCallback(
        async (
            provider: InjectedEvmProvider,
            walletName: string,
            preference: Exclude<EvmProviderPreference, "auto">,
        ) => {
            const accounts = (await provider.request({
                method: "eth_requestAccounts",
            })) as string[];
            if (!accounts || accounts.length === 0) {
                throw new Error(`No ${walletName} accounts found.`);
            }
            setWallet({
                type: "metamask",
                address: accounts[0],
                name: walletName,
                evmProviderPreference: preference,
            });
            setShowPicker(false);
        },
        [],
    );

    const connectMetaMask = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            if (typeof window === "undefined") return;
            const win = window as typeof window & { ethereum?: InjectedEvmProvider };
            const provider = findInjectedProvider("metamask", win);
            if (!provider) {
                setError("MetaMask not found. Please install the MetaMask browser extension.");
                setIsConnecting(false);
                return;
            }
            await connectInjectedEvmWallet(provider, "MetaMask", "metamask");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`MetaMask error: ${msg}`);
        } finally {
            setIsConnecting(false);
        }
    }, [connectInjectedEvmWallet]);

    const connectSubWallet = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            if (typeof window === "undefined") return;
            const win = window as typeof window & { ethereum?: InjectedEvmProvider };
            const provider = findInjectedProvider("subwallet", win);
            if (!provider) {
                setError(
                    "SubWallet EVM not found. Enable the EVM account in SubWallet first.",
                );
                setIsConnecting(false);
                return;
            }
            await connectInjectedEvmWallet(provider, "SubWallet", "subwallet");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`SubWallet error: ${msg}`);
        } finally {
            setIsConnecting(false);
        }
    }, [connectInjectedEvmWallet]);

    const connectPolkadot = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
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
            const acc =
                accounts.find((account) =>
                    account.meta.source?.toLowerCase().includes("subwallet"),
                ) ?? accounts[0];
            const source = acc.meta.source?.toLowerCase() ?? "";
            const walletLabel = source.includes("subwallet")
                ? "SubWallet (Polkadot)"
                : source.includes("talisman")
                    ? "Talisman (Polkadot)"
                    : "Polkadot Wallet";
            setWallet({
                type: "polkadot",
                address: acc.address,
                name: walletLabel,
                evmProviderPreference: undefined,
                polkadotAccount: acc,
                polkadotSource: acc.meta.source,
            });
            setShowPicker(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Polkadot wallet error: ${msg}`);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setWallet(null);
        setError(null);
    }, []);

    const truncateAddress = (address: string) =>
        address.length > 16
            ? `${address.slice(0, 8)}...${address.slice(-6)}`
            : address;

    const getEthersProvider = useCallback(async (preference: EvmProviderPreference = "auto") => {
        if (typeof window === "undefined") return null;
        const win = window as typeof window & { ethereum?: InjectedEvmProvider };
        const provider = findInjectedProvider(preference, win);
        if (!provider) return null;
        const { BrowserProvider } = await import("ethers");
        return new BrowserProvider(provider);
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
                connectSubWallet,
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

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
    return ctx;
}
