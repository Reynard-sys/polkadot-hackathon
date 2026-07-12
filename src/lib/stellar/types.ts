export type PaymentAssetCode = "XLM" | "USDC";
export type PackTier = "standard" | "premium" | "ultra";

export type PackCheckoutRequest = {
  walletAddress: string;
  seriesOrDropId: string;
  packTier: PackTier;
  paymentAsset: PaymentAssetCode;
};

export type PackCheckoutResponse = {
  checkoutId: string;
  recipient: string;
  amount: string;
  asset: PaymentAssetCode;
  memo: string;
  phpEquivalent: number;
};

export type InventoryCardInstanceDto = {
  instanceId: string;
  catalogId: string;
  tokenId: number | null;
  serialNumber: number | null;
  status: string;
  ownerWalletAddress: string;
  name: string;
  subtitle: string | null;
  anime: string;
  rarity: string;
  element: string | null;
  mana: number | null;
  power: number | null;
  hp: number | null;
  zone: string | null;
  zones: string[];
  leaderEligible: boolean;
  traits: string[];
  ability: unknown;
  leaderAbility: unknown;
  imageUrl: string;
  sourceType: "demo" | "artist" | "ip";
  sourceName: string;
  playable: boolean;
  supplyCap: number | null;
  issuedCount: number | null;
  listing: {
    id: string;
    priceAsset: PaymentAssetCode;
    priceAmount: string;
    phpEquivalent: number | null;
    status: string;
  } | null;
};
