import { getPlatformStellarAddress, getHorizonUrl } from "@/lib/server-env";
import type { PaymentAssetCode } from "@/lib/stellar/types";

type HorizonTransaction = {
  successful: boolean;
  source_account: string;
  memo?: string;
  memo_type?: string;
};

type HorizonPaymentOperation = {
  type: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
};

async function fetchHorizonJson<T>(path: string) {
  const response = await fetch(`${getHorizonUrl()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load Stellar transaction details.");
  }

  return (await response.json()) as T;
}

export async function verifyPaymentTransaction(input: {
  transactionHash: string;
  sender: string;
  expectedMemo: string;
  expectedAmount: string;
  expectedAsset: PaymentAssetCode;
  expectedRecipient?: string;
}) {
  const transaction = await fetchHorizonJson<HorizonTransaction>(
    `/transactions/${input.transactionHash}`,
  );

  if (!transaction.successful) {
    throw new Error("Stellar transaction was not successful.");
  }

  if (transaction.source_account.toUpperCase() !== input.sender.toUpperCase()) {
    throw new Error("Transaction sender does not match authenticated wallet.");
  }

  const memo = transaction.memo_type === "none" ? "" : (transaction.memo ?? "");
  if (memo !== input.expectedMemo) {
    throw new Error("Transaction memo does not match checkout.");
  }

  const operationsPayload = await fetchHorizonJson<{
    _embedded: { records: HorizonPaymentOperation[] };
  }>(`/transactions/${input.transactionHash}/operations`);

  const payment = operationsPayload._embedded.records.find((record) => {
    if (record.type !== "payment") return false;
    if (!record.to || !record.amount) return false;
    const recipient = input.expectedRecipient ?? getPlatformStellarAddress();
    if (record.to.toUpperCase() !== recipient.toUpperCase()) {
      return false;
    }

    if (Number.parseFloat(record.amount) !== Number.parseFloat(input.expectedAmount)) {
      return false;
    }

    if (input.expectedAsset === "XLM") {
      return record.asset_type === "native";
    }

    return record.asset_type !== "native" && record.asset_code === "USDC";
  });

  if (!payment) {
    throw new Error("No matching Stellar payment operation found.");
  }

  return transaction;
}
