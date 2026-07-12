"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { signMessage } from "@stellar/freighter-api";
import { useStellarWallet } from "@/context/stellar-wallet-context";

type AuthSessionValue = {
  walletAddress: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
  authenticate: (walletAddress?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

async function fetchSession() {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });
  return (await response.json()) as {
    walletAddress: string | null;
    isAuthenticated: boolean;
  };
}

function signatureToBase64(value: string | Buffer | null) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();

  const normalized = new TextDecoder().decode(new Uint8Array(value)).trim();
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) && normalized.length >= 80) {
    return normalized;
  }

  let binary = "";
  const bytes = new Uint8Array(value);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useStellarWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const session = await fetchSession();
    setWalletAddress(session.walletAddress);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthSessionValue>(
    () => ({
      walletAddress,
      isAuthenticated: Boolean(walletAddress),
      isAuthenticating,
      error,
      authenticate: async (connectedAddress?: string) => {
        const address = connectedAddress ?? publicKey;
        if (!address) {
          const message = "Connect Freighter before signing in.";
          setError(message);
          throw new Error(message);
        }

        setIsAuthenticating(true);
        setError(null);
        try {
          const challengeResponse = await fetch("/api/auth/challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ walletAddress: address }),
          });

          const challenge = (await challengeResponse.json()) as {
            nonce?: string;
            message?: string;
            error?: string;
          };
          if (!challengeResponse.ok || !challenge.message) {
            throw new Error(challenge.error ?? "Failed to request auth challenge.");
          }

          const signed = await signMessage(challenge.message, { address });
          const signature = signatureToBase64(signed.signedMessage ?? null);
          if (!signature) {
            throw new Error(signed.error?.message ?? "Freighter did not return a valid signature.");
          }

          const verifyResponse = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              walletAddress: address,
              signature,
            }),
          });
          const verified = (await verifyResponse.json()) as {
            walletAddress?: string;
            error?: string;
          };
          if (!verifyResponse.ok || !verified.walletAddress) {
            throw new Error(verified.error ?? "Failed to verify wallet signature.");
          }

          setWalletAddress(verified.walletAddress);
        } catch (authError) {
          const message =
            authError instanceof Error
              ? authError.message
              : "Failed to authenticate wallet.";
          setError(message);
          throw new Error(message);
        } finally {
          setIsAuthenticating(false);
        }
      },
      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        setWalletAddress(null);
      },
      refresh,
    }),
    [error, isAuthenticating, publicKey, walletAddress],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used inside <AuthSessionProvider>");
  }
  return context;
}
