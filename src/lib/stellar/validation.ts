import { Keypair } from "@stellar/stellar-sdk";
import { z } from "zod";

export const stellarAddressSchema = z.string().refine((value) => {
  try {
    Keypair.fromPublicKey(value);
    return true;
  } catch {
    return false;
  }
}, "Invalid Stellar public key");

export const paymentAssetSchema = z.enum(["XLM", "USDC"]);
export const packTierSchema = z.enum(["standard", "premium", "ultra"]);
