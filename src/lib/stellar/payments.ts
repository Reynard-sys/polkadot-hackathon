import type { PaymentAssetCode, PackTier } from "@/lib/stellar/types";

const PACK_PRICES: Record<PackTier, Record<PaymentAssetCode, string>> = {
  standard: { XLM: "15", USDC: "4" },
  premium: { XLM: "27", USDC: "7" },
  ultra: { XLM: "38", USDC: "10" },
};

const PACK_PHP: Record<PackTier, number> = {
  standard: 240,
  premium: 420,
  ultra: 600,
};

export function getPackPrice(packTier: PackTier, asset: PaymentAssetCode) {
  return PACK_PRICES[packTier][asset];
}

export function getPackPhpEquivalent(packTier: PackTier) {
  return PACK_PHP[packTier];
}

export function estimatePhpEquivalent(amount: string, asset: PaymentAssetCode) {
  const numericAmount = Number.parseFloat(amount);
  if (asset === "USDC") return numericAmount * 58;
  return numericAmount * 16;
}
