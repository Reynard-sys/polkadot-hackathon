import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/lib/server-env";

const SESSION_COOKIE = "aniverse_session";
const CHALLENGE_COOKIE = "aniverse_auth_challenge";

type SignedPayload = {
  walletAddress: string;
  nonce: string;
  expiresAt: number;
};

function encodePayload(payload: SignedPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): SignedPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SignedPayload;
  } catch {
    return null;
  }
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSignedCookie(payload: SignedPayload) {
  const encoded = encodePayload(payload);
  return `${encoded}.${signValue(encoded)}`;
}

function parseSignedCookie(value: string | undefined | null) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = signValue(encoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

export async function createChallengeCookie(walletAddress: string, nonce: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    CHALLENGE_COOKIE,
    createSignedCookie({
      walletAddress: walletAddress.toUpperCase(),
      nonce,
      expiresAt: Date.now() + 5 * 60 * 1000,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 5,
    },
  );
}

export async function readChallengeCookie() {
  const cookieStore = await cookies();
  return parseSignedCookie(cookieStore.get(CHALLENGE_COOKIE)?.value);
}

export async function clearChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE);
}

export async function createSessionCookie(walletAddress: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    createSignedCookie({
      walletAddress: walletAddress.toUpperCase(),
      nonce: "session",
      expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

export async function readSessionWallet() {
  const cookieStore = await cookies();
  const payload = parseSignedCookie(cookieStore.get(SESSION_COOKIE)?.value);
  return payload?.walletAddress ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
