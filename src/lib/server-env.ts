function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getSessionSecret() {
  return getRequiredEnv("SESSION_SECRET");
}

export function getPlatformStellarAddress() {
  return getRequiredEnv("NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS");
}

export function getHorizonUrl() {
  return (
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
    "https://horizon-testnet.stellar.org"
  );
}

export function getStellarNetworkPassphrase() {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";
}

export function getUsdcAssetCode() {
  return process.env.NEXT_PUBLIC_USDC_ASSET_CODE ?? "USDC";
}

export function getUsdcIssuer() {
  return process.env.NEXT_PUBLIC_USDC_ISSUER ?? "";
}
