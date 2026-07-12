import { Asset } from "@stellar/stellar-sdk";
import { getUsdcAssetCode, getUsdcIssuer } from "@/lib/server-env";
import type { PaymentAssetCode } from "@/lib/stellar/types";

export function getAssetLabel(asset: PaymentAssetCode) {
  return asset;
}

export function getAssetForCode(asset: PaymentAssetCode) {
  if (asset === "XLM") {
    return Asset.native();
  }

  const issuer = getUsdcIssuer();
  if (!issuer) {
    throw new Error("USDC issuer is not configured.");
  }

  return new Asset(getUsdcAssetCode(), issuer);
}
