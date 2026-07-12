"use client";

import { signTransaction } from "@stellar/freighter-api";
import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type { PaymentAssetCode } from "@/lib/stellar/types";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";
const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS ?? "";
const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
const USDC_CODE = process.env.NEXT_PUBLIC_USDC_ASSET_CODE ?? "USDC";
const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER ?? "";

export function getClientNetworkPassphrase() {
  return STELLAR_NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;
}

function getAsset(asset: PaymentAssetCode) {
  if (asset === "XLM") {
    return Asset.native();
  }
  if (!USDC_ISSUER) {
    throw new Error("USDC issuer is not configured.");
  }
  return new Asset(USDC_CODE, USDC_ISSUER);
}

async function buildPaymentTransactionXdr(input: {
  walletAddress: string;
  amount: string;
  memo: string;
  paymentAsset: PaymentAssetCode;
  recipient?: string;
}) {
  const server = new Horizon.Server(HORIZON_URL);
  const sourceAccount = await server.loadAccount(input.walletAddress);
  const account = new Account(
    sourceAccount.accountId(),
    sourceAccount.sequenceNumber(),
  );

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getClientNetworkPassphrase(),
  })
    .addOperation(
      Operation.payment({
        destination: input.recipient ?? PLATFORM_ADDRESS,
        amount: input.amount,
        asset: getAsset(input.paymentAsset),
      }),
    )
    .addMemo(Memo.text(input.memo))
    .setTimeout(120);

  return builder.build().toXDR();
}

export async function signAndSubmitPayment(input: {
  walletAddress: string;
  amount: string;
  memo: string;
  paymentAsset: PaymentAssetCode;
  recipient?: string;
}) {
  const transactionXdr = await buildPaymentTransactionXdr(input);
  const signed = await signTransaction(transactionXdr, {
    address: input.walletAddress,
    networkPassphrase: getClientNetworkPassphrase(),
  });

  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message ?? "Freighter did not sign the transaction.");
  }

  const params = new URLSearchParams();
  params.set("tx", signed.signedTxXdr);

  const response = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { extras?: { result_codes?: { transaction?: string } } }
      | null;
    throw new Error(
      errorPayload?.extras?.result_codes?.transaction ??
        "Failed to submit Stellar transaction.",
    );
  }

  return (await response.json()) as { hash: string };
}
