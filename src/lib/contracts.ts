// src/lib/contracts.ts
// Contract addresses are set in .env.local (NEXT_PUBLIC_* so they are safe to expose in the browser)
import type { InterfaceAbi } from "ethers";
import GachaPackABIJson from "./abi/GachaPack.json";
import GachaNFTABIJson from "./abi/GachaNFT.json";

export const GACHA_PACK_ADDRESS =
  process.env.NEXT_PUBLIC_GACHA_PACK_ADDRESS ?? "";
export const GACHA_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS ?? "";

export const GACHA_PACK_ABI = (GachaPackABIJson as { abi: InterfaceAbi }).abi;
export const GACHA_NFT_ABI  = (GachaNFTABIJson  as { abi: InterfaceAbi }).abi;
