# Gacha Page — Pack Opening Integration Guide

> **Scope:** How to wire the `/gacha` page to the deployed smart contracts.  
> The page has three buttons: **Open x10**, **Open x20**, **Open x30** — one per pack type.

---

## Prerequisites

Before building the page, make sure you have:

- [ ] Contracts deployed (run `npx hardhat run scripts/fullSmokeTest.ts --network westend_assethub`)
- [ ] Contract addresses saved to `.env.local` in the Next.js root:

```env
NEXT_PUBLIC_GACHA_PACK_ADDRESS=0x<your_GachaPack_address>
NEXT_PUBLIC_GACHA_NFT_ADDRESS=0x<your_GachaNFT_address>
```

- [ ] `ethers` installed in the Next.js root:
```bash
npm install ethers
```

---

## Step 1 — Copy Contract ABIs to the Frontend

After compiling, copy the relevant ABI files from the compiled artifacts:

```
contracts/artifacts/contracts/GachaPack.sol/GachaPack.json  →  src/lib/abi/GachaPack.json
contracts/artifacts/contracts/GachaNFT.sol/GachaNFT.json    →  src/lib/abi/GachaNFT.json
```

> **Tip:** You only need the `"abi"` array from these files, not the full JSON.

---

## Step 2 — Create `src/lib/contracts.ts`

This file holds your contract addresses and ABI references. Create it:

```ts
// src/lib/contracts.ts
import GachaPackABI from "./abi/GachaPack.json";
import GachaNFTABI  from "./abi/GachaNFT.json";

export const GACHA_PACK_ADDRESS = process.env.NEXT_PUBLIC_GACHA_PACK_ADDRESS!;
export const GACHA_NFT_ADDRESS  = process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS!;

export const GACHA_PACK_ABI = GachaPackABI.abi;
export const GACHA_NFT_ABI  = GachaNFTABI.abi;
```

---

## Step 3 — Create `src/hooks/usePackOpening.ts`

This hook handles the actual contract call when a button is clicked.

```ts
// src/hooks/usePackOpening.ts
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/wallet-context";
import { GACHA_PACK_ADDRESS, GACHA_PACK_ABI } from "@/lib/contracts";

export type PackType = "standard" | "premium" | "ultra";

const PACK_CONFIG: Record<PackType, { method: string; price: string; size: number }> = {
  standard: { method: "openStandardPack", price: "0.001",  size: 10 },
  premium:  { method: "openPremiumPack",  price: "0.0018", size: 20 },
  ultra:    { method: "openUltraPack",    price: "0.0025", size: 30 },
};

export function usePackOpening() {
  const { wallet, getEthersProvider } = useWallet();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult]       = useState<number[] | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const openPack = async (packType: PackType) => {
    if (!wallet) {
      setError("Please connect your MetaMask wallet first.");
      return;
    }
    if (wallet.type !== "metamask") {
      setError("Pack opening requires MetaMask (EVM wallet). Please connect MetaMask.");
      return;
    }

    setIsOpening(true);
    setError(null);
    setResult(null);

    try {
      const provider = await getEthersProvider();
      if (!provider) throw new Error("Could not get ethers provider");

      const signer   = await provider.getSigner();
      const cfg      = PACK_CONFIG[packType];
      const contract = new ethers.Contract(GACHA_PACK_ADDRESS, GACHA_PACK_ABI, signer);

      // Call the pack method, sending the required WND/ETH amount
      const tx = await contract[cfg.method]({
        value: ethers.parseEther(cfg.price),
      });

      const receipt = await tx.wait();

      // Parse PackOpened event to get the token IDs
      const iface = new ethers.Interface([
        "event PackOpened(address indexed player, uint8 packType, uint256[] tokenIds)",
      ]);

      const tokenIds: number[] = [];
      for (const log of receipt.logs ?? []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "PackOpened") {
            tokenIds.push(...parsed.args.tokenIds.map((id: bigint) => Number(id)));
          }
        } catch { /* skip non-matching logs */ }
      }

      setResult(tokenIds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Surface user-friendly errors
      if (msg.includes("user rejected")) setError("Transaction cancelled.");
      else if (msg.includes("insufficient funds")) setError("Insufficient balance for this pack.");
      else setError(`Transaction failed: ${msg.slice(0, 120)}`);
    } finally {
      setIsOpening(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { openPack, isOpening, result, error, reset };
}
```

---

## Step 4 — Add Network Check Helper

The contracts are on Westend AssetHub (chainId `420420421`). Add a check so MetaMask switches networks automatically:

```ts
// src/lib/switchToWestend.ts
export async function switchToWestend() {
  const win = window as typeof window & { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } };
  if (!win.ethereum) return;

  const WESTEND_CHAIN_ID = "0x190fc65"; // 420420421 in hex

  try {
    await win.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: WESTEND_CHAIN_ID }],
    });
  } catch (err: unknown) {
    // Chain not added yet — add it
    if ((err as { code?: number }).code === 4902) {
      await win.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: WESTEND_CHAIN_ID,
          chainName: "Westend AssetHub",
          nativeCurrency: { name: "WND", symbol: "WND", decimals: 18 },
          rpcUrls: ["https://westend-asset-hub-eth-rpc.polkadot.io"],
          blockExplorerUrls: ["https://assethub-westend.subscan.io"],
        }],
      });
    }
  }
}
```

Call `switchToWestend()` inside `openPack()` before the contract call.

---

## Step 5 — Build the `/gacha` Page

Create `src/app/gacha/page.tsx`:

```tsx
// src/app/gacha/page.tsx
import GachaFeature from "@/features/gacha";
export default function GachaPage() {
  return <GachaFeature />;
}
```

Then create `src/features/gacha/index.tsx`:

```tsx
"use client";
import { usePackOpening, PackType } from "@/hooks/usePackOpening";
import { useWallet } from "@/context/wallet-context";
import cardsData from "@/data/cards.json"; // for card name lookup

const PACK_BUTTONS: { type: PackType; label: string; price: string; size: number; color: string }[] = [
  { type: "standard", label: "Open x10", price: "0.001 WND",  size: 10, color: "from-blue-600 to-blue-400" },
  { type: "premium",  label: "Open x20", price: "0.0018 WND", size: 20, color: "from-purple-600 to-purple-400" },
  { type: "ultra",    label: "Open x30", price: "0.0025 WND", size: 30, color: "from-yellow-600 to-orange-400" },
];

export default function GachaFeature() {
  const { wallet, openPicker } = useWallet();
  const { openPack, isOpening, result, error, reset } = usePackOpening();

  // Map tokenId → card name for display
  const getCardName = (tokenId: number) =>
    cardsData.find((c) => c.nftTokenId === String(tokenId))?.name ?? `Card #${tokenId}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 pt-24">
      <h1 className="text-4xl font-bold text-white">Open Packs</h1>

      {!wallet && (
        <button
          onClick={openPicker}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
        >
          Connect Wallet to Open Packs
        </button>
      )}

      {wallet && (
        <div className="flex flex-col sm:flex-row gap-4">
          {PACK_BUTTONS.map(({ type, label, price, size, color }) => (
            <button
              key={type}
              onClick={() => openPack(type)}
              disabled={isOpening}
              className={`relative px-8 py-5 rounded-2xl bg-gradient-to-br ${color} text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="block text-2xl font-black">{label}</span>
              <span className="block text-sm font-normal opacity-80">{size} cards · {price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isOpening && (
        <p className="text-white/60 animate-pulse">Opening pack, waiting for confirmation…</p>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-900/40 border border-red-500/40 rounded-xl px-6 py-4 text-red-300 text-sm max-w-sm text-center">
          {error}
          <button onClick={reset} className="block mt-2 text-xs underline opacity-70">Dismiss</button>
        </div>
      )}

      {/* Result: show pulled cards */}
      {result && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
          <h2 className="text-white font-bold text-xl mb-4 text-center">
            🎉 You got {result.length} cards!
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {result.map((tokenId, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-3 py-2 text-center">
                <span className="text-white text-sm font-medium">{getCardName(tokenId)}</span>
                <span className="block text-white/40 text-xs">#{tokenId}</span>
              </div>
            ))}
          </div>
          <button onClick={reset} className="mt-4 w-full text-white/50 text-xs underline">
            Open another pack
          </button>
        </div>
      )}
    </main>
  );
}
```

---

## Summary: How Pack Opening Works (End-to-End)

```
User clicks "Open x10"
       │
       ▼
usePackOpening.openPack("standard")
       │
       ├─ checks wallet.type === "metamask"
       ├─ calls switchToWestend()        ← switches MetaMask to Westend AssetHub
       ├─ gets ethers.BrowserProvider    ← from wallet-context.getEthersProvider()
       ├─ creates GachaPack contract instance
       │
       ▼
contract.openStandardPack({ value: 0.001 ETH })
       │
       ├─ MetaMask pops up asking to confirm tx
       ├─ User approves → tx sent to Westend AssetHub
       │
       ▼
GachaPack.sol executes on-chain:
  - rolls rarity for each of 10 slots
  - draws unique card per slot
  - mints all 10 as ERC-1155 tokens to msg.sender
  - emits PackOpened(player, packType, tokenIds[])
       │
       ▼
Frontend reads PackOpened event from tx receipt
       │
       ▼
result[] = [tokenId1, tokenId2, ..., tokenId10]
       │
       ▼
UI shows cards by looking up tokenId in cards.json
```

---

## Important Notes

| Topic | Detail |
|-------|--------|
| **Wallet required** | Only MetaMask works for pack opening — Polkadot wallets can't send EVM txns |
| **Currency** | Westend AssetHub uses **WND** (testnet token), not ETH. Get free WND from [faucet.polkadot.io](https://faucet.polkadot.io) |
| **Pack prices** | Standard 0.001 WND · Premium 0.0018 WND · Ultra 0.0025 WND |
| **Card reveal** | The `tokenIds[]` from the event are the ERC-1155 token IDs (1–48). Look up by `nftTokenId` in `cards.json` for name/image |
| **IPFS images** | Card images are at `https://ipfs.io/ipfs/bafybeiccbcahhjafae4vqgylzb57u64ac4ukjgmt2kpwugfi7rdwzrduvu/<tokenId>.json` |
| **Network switch** | Call `switchToWestend()` before the contract call so MetaMask auto-adds the network if needed |
