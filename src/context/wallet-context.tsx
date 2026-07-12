"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStellarWallet } from "@/context/stellar-wallet-context";
import { useAuthSession } from "@/context/auth-session-context";

export type WalletType = "freighter";

export interface ConnectedWallet {
  type: WalletType;
  address: string;
  name: string;
}

interface WalletContextValue {
  wallet: ConnectedWallet | null;
  isConnecting: boolean;
  error: string | null;
  showPicker: boolean;
  openPicker: () => void;
  closePicker: () => void;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
  truncateAddress: (address: string) => string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [showPicker, setShowPicker] = useState(false);
  const stellar = useStellarWallet();
  const session = useAuthSession();

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet: stellar.publicKey
        ? {
            type: "freighter",
            address: stellar.publicKey,
            name: "Freighter",
          }
        : null,
      isConnecting: stellar.isConnecting || session.isAuthenticating,
      error: stellar.error ?? session.error,
      showPicker,
      openPicker: () => setShowPicker(true),
      closePicker: () => setShowPicker(false),
      connectMetaMask: async () => {
        const address = await stellar.connect();
        if (!session.isAuthenticated || session.walletAddress !== address) {
          await session.authenticate(address);
        }
        setShowPicker(false);
      },
      disconnect: () => {
        stellar.disconnect();
        void session.logout();
      },
      truncateAddress: (address: string) => stellar.truncateAddress(address),
    }),
    [
      session,
      showPicker,
      stellar,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside <WalletProvider>");
  }
  return context;
}
