// src/lib/switchToWestend.ts
// Switches MetaMask to Westend AssetHub, or adds it if not present.
// Chain ID: 420420421 (0x190f1b45)

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const WESTEND_CHAIN_ID = "0x190f1b45"; // 420420421 — verified correct hex

export async function switchToWestend(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: WESTEND_CHAIN_ID }],
    });
  } catch (err: unknown) {
    // 4902 = chain not added yet
    if ((err as { code?: number }).code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: WESTEND_CHAIN_ID,
            chainName: "Westend AssetHub",
            nativeCurrency: { name: "WND", symbol: "WND", decimals: 18 },
            rpcUrls: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
            blockExplorerUrls: ["https://assethub-westend.subscan.io"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
