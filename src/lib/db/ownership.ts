import { OwnershipReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordOwnershipChange(input: {
  cardInstanceId: string;
  fromWalletAddress?: string | null;
  toWalletAddress: string;
  reason: OwnershipReason;
  relatedTransactionHash?: string | null;
}) {
  return prisma.ownershipHistory.create({
    data: {
      cardInstanceId: input.cardInstanceId,
      fromWalletAddress: input.fromWalletAddress ?? null,
      toWalletAddress: input.toWalletAddress.toUpperCase(),
      reason: input.reason,
      relatedTransactionHash: input.relatedTransactionHash ?? null,
    },
  });
}
