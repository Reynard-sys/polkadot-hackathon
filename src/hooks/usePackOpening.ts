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
        const cfg      = PACK_CONFIG[packType];

        // Westend AssetHub (Frontier EVM): explicit gas required, same as deploy.ts.
        // gasPrice 10 gwei + gasLimit 10B worked for the original contract.
        const FRONTIER_GAS = {
          gasPrice: BigInt("10000000000"),  // 10 gwei
          gasLimit: BigInt("10000000000"),  // 10B
        };
        // series: 0 = Naruto (IDs 1-16), 1 = OnePiece (IDs 17-32)
        const seriesIndex = series === "onepiece" ? 1 : 0;
        const tx = await contract[cfg.method](seriesIndex, {
          value: ethers.parseEther(cfg.price),
          ...FRONTIER_GAS,
        });
        const receipt = await tx.wait();

        // Frontier EVM doesn't support ethers parseLog reliably.
        // Instead: match the known TransferBatch topic hash manually, then
        // ABI-decode the data field (non-indexed params: ids[], values[]).
        //
        // TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)
        // topic[0] = keccak256 of the event signature (constant below)
        // topic[2] = from (indexed) — 0x0 for mints
        // data     = abi.encode(ids, values)
        const TRANSFER_BATCH_TOPIC =
          "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";
        const ZERO_TOPIC =
          "0x0000000000000000000000000000000000000000000000000000000000000000";

        const tokenIds: number[] = [];
        for (const log of receipt?.logs ?? []) {
          try {
            const topics = (log as { topics?: string[] }).topics ?? [];
            if (
              topics[0]?.toLowerCase() === TRANSFER_BATCH_TOPIC &&
              topics[2] === ZERO_TOPIC   // from == address(0) → this is a mint
            ) {
              const [ids] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256[]", "uint256[]"],
                (log as { data?: string }).data ?? "0x"
              );
              tokenIds.push(...(ids as bigint[]).map(Number));
            }
          } catch (e) {
            console.warn("[GachaPack] log decode error:", e);
          }
        }

        if (tokenIds.length === 0) {
          console.warn("[GachaPack] No TransferBatch mint log found. Logs:", receipt?.logs);
          setError("Transaction confirmed but could not read card IDs. Check your inventory.");
          return;
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
      // Log the full raw error so it's visible in browser console for debugging
      console.error("[GachaPack] raw error:", err);
      // Ethers v6 throws structured EthersError objects — not plain Error instances.
      // Drill through the known fields to get a readable message.
      const extractMsg = (e: unknown): string => {
        if (!e || typeof e !== "object") return String(e);
        const o = e as Record<string, unknown>;
        if (typeof o.shortMessage === "string") return o.shortMessage;
        if (typeof o.reason      === "string") return o.reason;
        if (typeof o.message     === "string") return o.message;
        if (o.info && typeof o.info === "object") {
          const ie = (o.info as Record<string, unknown>).error;
          if (ie && typeof ie === "object" && typeof (ie as Record<string,unknown>).message === "string")
            return (ie as Record<string,unknown>).message as string;
        }
        try { return JSON.stringify(e); } catch { return "[unknown error]"; }
      };
      const msg = extractMsg(err);
      if (msg.includes("user rejected") || msg.includes("User denied") || msg.includes("ACTION_REJECTED"))
        setError("Transaction cancelled.");
      else if (msg.includes("insufficient funds"))
        setError("Insufficient WND balance.");
      else
        setError(`Failed: ${msg.slice(0, 200)}`);
    } finally {
      setIsOpening(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { openPack, isOpening, result, error, reset, simMode };
}
