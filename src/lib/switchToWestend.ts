// src/lib/switchToWestend.ts
// Switches MetaMask to Westend AssetHub, or adds it if not present.
// Chain ID: 420420421 (0x190f1b45)

type EthereumProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  send?: (
    method: string,
    params: unknown[] | Record<string, unknown>,
  ) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const WESTEND_CHAIN_ID = "0x190f1b45"; // 420420421 — verified correct hex

async function sendRpc(
  provider: EthereumProvider,
  method: string,
  params?: unknown[],
) {
  if (provider.request) {
    return provider.request({ method, params });
  }

  if (provider.send) {
    return provider.send(method, params ?? []);
  }

  throw new Error("Wallet provider does not support JSON-RPC requests.");
}

export async function switchToWestend(provider?: EthereumProvider): Promise<void> {
  const targetProvider =
    provider ??
    (typeof window !== "undefined" ? window.ethereum : undefined);
  if (!targetProvider) return;

  try {
    await sendRpc(targetProvider, "wallet_switchEthereumChain", [
      { chainId: WESTEND_CHAIN_ID },
    ]);
  } catch (err: unknown) {
    // 4902 = chain not added yet
    if ((err as { code?: number }).code === 4902) {
      await sendRpc(targetProvider, "wallet_addEthereumChain", [
        {
          chainId: WESTEND_CHAIN_ID,
          chainName: "Westend AssetHub",
          nativeCurrency: { name: "WND", symbol: "WND", decimals: 18 },
          rpcUrls: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
          blockExplorerUrls: ["https://assethub-westend.subscan.io"],
        },
      ]);
    } else {
      throw err;
    }
  }
}
