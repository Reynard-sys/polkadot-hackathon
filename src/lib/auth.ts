import { createHash, randomUUID } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearChallengeCookie,
  createChallengeCookie,
  createSessionCookie,
  readChallengeCookie,
  readSessionWallet,
} from "@/lib/session";

export const walletAddressSchema = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      Keypair.fromPublicKey(value);
      return true;
    } catch {
      return false;
    }
  }, "Invalid Stellar address");

function normalizeWalletAddress(walletAddress: string) {
  return walletAddressSchema.parse(walletAddress).toUpperCase();
}

function buildChallengeMessage(walletAddress: string, nonce: string) {
  return [
    "Aniverse Nexus Stellar Sign-In",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    "Purpose: Authenticate for inventory, pack purchases, and marketplace actions.",
  ].join("\n");
}

function normalizeSignature(signature: string) {
  return Buffer.from(signature, "base64");
}

function buildSep53Payload(message: string) {
  return Buffer.concat([
    Buffer.from("Stellar Signed Message:\n", "utf8"),
    Buffer.from(message, "utf8"),
  ]);
}

function hashSep53Payload(message: string) {
  return createHash("sha256").update(buildSep53Payload(message)).digest();
}

export async function issueWalletChallenge(walletAddress: string) {
  const normalized = normalizeWalletAddress(walletAddress);
  const nonce = randomUUID();
  await createChallengeCookie(normalized, nonce);

  return {
    nonce,
    message: buildChallengeMessage(normalized, nonce),
  };
}

export async function verifyWalletChallenge(input: {
  walletAddress: string;
  signature: string;
}) {
  const challenge = await readChallengeCookie();
  if (!challenge) {
    throw new Error("Missing or expired auth challenge.");
  }

  const walletAddress = normalizeWalletAddress(input.walletAddress);
  if (walletAddress !== challenge.walletAddress) {
    throw new Error("Wallet address does not match challenge.");
  }

  const message = buildChallengeMessage(walletAddress, challenge.nonce);
  const verifier = Keypair.fromPublicKey(walletAddress);
  const isValid = verifier.verify(
    hashSep53Payload(message),
    normalizeSignature(input.signature),
  );

  if (!isValid) {
    throw new Error("Invalid Stellar signature.");
  }

  await prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress },
  });

  await createSessionCookie(walletAddress);
  await clearChallengeCookie();

  return { walletAddress };
}

export async function requireSessionWallet() {
  const walletAddress = await readSessionWallet();
  if (!walletAddress) {
    throw new Error("Authentication required.");
  }
  return walletAddress;
}
