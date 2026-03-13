"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/wallet-context";
import { GACHA_PACK_ADDRESS, GACHA_PACK_ABI } from "@/lib/contracts";
import { switchToWestend } from "@/lib/switchToWestend";
import { simulatePack, PackSeries } from "@/lib/gacha-engine";

export type PackType = "standard" | "premium" | "ultra";
export type { PackSeries };

const PACK_CONFIG: Record<PackType, { method: string; price: string }> = {
  standard: { method: "openStandardPack", price: "0.001"  },
  premium:  { method: "openPremiumPack",  price: "0.0018" },
  ultra:    { method: "openUltraPack",    price: "0.0025" },
};

function isSimulationMode(): boolean {
  const addr = GACHA_PACK_ADDRESS;
  return !addr || addr === "" || addr === "0x0000000000000000000000000000000000000000";
}

export interface PackResult {
  tokenIds: number[];
  packType: PackType;
  series: PackSeries;
}

export function usePackOpening() {
  const { wallet, getEthersProvider } = useWallet();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult]       = useState<PackResult | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [simMode]                 = useState(isSimulationMode);

  const openPack = async (packType: PackType, series: PackSeries) => {
    setIsOpening(true);
    setError(null);
    setResult(null);

    try {
      // ── On-chain mode (contract deployed) ───────────────────────────────
      if (!simMode) {
        if (!wallet || wallet.type !== "metamask") {
          setError("Pack opening requires MetaMask.");
          return;
        }
        await switchToWestend();
        const provider = await getEthersProvider();
        if (!provider) throw new Error("Could not get provider.");
        const signer   = await provider.getSigner();
        const contract = new ethers.Contract(GACHA_PACK_ADDRESS, GACHA_PACK_ABI, signer);
        const gasPrice = ethers.parseUnits("1", "gwei");
        const cfg      = PACK_CONFIG[packType];

        const tx = await contract[cfg.method]({
          value: ethers.parseEther(cfg.price),
          gasPrice,
        });
        const receipt = await tx.wait();

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
          } catch { /* skip */ }
        }
        setResult({ tokenIds, packType, series });
        return;
      }

      // ── Simulation mode ──────────────────────────────────────────────────
      // If MetaMask is connected: request personal_sign to seed the PRNG.
      // This gives a real Web3 interaction with zero gas cost.
      let walletSignature: string | undefined;

      if (wallet?.type === "metamask") {
        const provider = await getEthersProvider();
        if (provider) {
          const signer = await provider.getSigner();
          const addr   = await signer.getAddress();
          const msg    = `Anime Gacha TCG — open ${packType} ${series} pack\nNonce: ${Date.now()}`;
          walletSignature = await signer.signMessage(msg);
          // Sign only to prove identity and seed randomness — no gas, no tx.
          void addr;
        }
      } else {
        // No wallet — add a small delay so the loading state is visible
        await new Promise<void>(r => setTimeout(r, 800));
      }

      const simResult = simulatePack(packType, series, walletSignature);
      setResult({
        tokenIds: simResult.cards.map(c => c.tokenId),
        packType,
        series,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user rejected") || msg.includes("User denied") || msg.includes("ACTION_REJECTED"))
        setError("Signature cancelled.");
      else if (msg.includes("insufficient funds"))
        setError("Insufficient WND balance.");
      else
        setError(`Failed: ${msg.slice(0, 140)}`);
    } finally {
      setIsOpening(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { openPack, isOpening, result, error, reset, simMode };
}
