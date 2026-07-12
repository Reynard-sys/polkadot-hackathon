"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAddress,
  isConnected,
  requestAccess,
  setAllowed,
} from "@stellar/freighter-api";

export type StellarWalletContextValue = {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  truncateAddress: (address?: string | null) => string;
};

const StellarWalletContext = createContext<StellarWalletContextValue | null>(null);

function normalizeWalletError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to connect Freighter.";
}

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnectingState, setIsConnectingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncWallet = async () => {
      const status = await isConnected();
      if (!status.isConnected) return;
      const address = await getAddress();
      if (!address.error && address.address) {
        setPublicKey(address.address);
      }
    };

    void syncWallet();
  }, []);

  const value = useMemo<StellarWalletContextValue>(
    () => ({
      publicKey,
      isConnected: Boolean(publicKey),
      isConnecting: isConnectingState,
      error,
      connect: async () => {
        setIsConnectingState(true);
        setError(null);
        try {
          const allowed = await setAllowed();
          if (allowed.error) {
            throw new Error(allowed.error.message);
          }
          const response = await requestAccess();
          if (response.error || !response.address) {
            throw new Error(response.error?.message ?? "Freighter did not return a wallet address.");
          }
          setPublicKey(response.address);
          return response.address;
        } catch (connectError) {
          const message = normalizeWalletError(connectError);
          setError(message);
          throw new Error(message);
        } finally {
          setIsConnectingState(false);
        }
      },
      disconnect: () => {
        setPublicKey(null);
        setError(null);
      },
      truncateAddress: (address?: string | null) =>
        address && address.length > 16
          ? `${address.slice(0, 6)}...${address.slice(-6)}`
          : address ?? "",
    }),
    [error, isConnectingState, publicKey],
  );

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);
  if (!context) {
    throw new Error("useStellarWallet must be used inside <StellarWalletProvider>");
  }
  return context;
}
