import { z } from "zod";
import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPaymentTransaction } from "@/lib/stellar/transactions";
import { fulfillPackPurchase } from "@/lib/db/purchases";

const requestSchema = z.object({
  checkoutId: z.string().min(1),
  transactionHash: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const walletAddress = await requireSessionWallet();
    const body = requestSchema.parse(await request.json());
    const purchase = await prisma.packPurchase.findUnique({
      where: { id: body.checkoutId },
    });
    if (!purchase) {
      return jsonError("Pack checkout not found.", 404);
    }

    await verifyPaymentTransaction({
      transactionHash: body.transactionHash,
      sender: walletAddress,
      expectedMemo: purchase.memo,
      expectedAmount: purchase.amount,
      expectedAsset: purchase.paymentAsset,
    });

    const fulfilled = await fulfillPackPurchase({
      checkoutId: body.checkoutId,
      transactionHash: body.transactionHash,
    });

    return Response.json({
      purchaseId: fulfilled.purchaseId,
      packResult: {
        tokenIds: fulfilled.tokenIds,
        cardInstanceIds: fulfilled.cardInstanceIds,
        series: fulfilled.series,
        packTier: fulfilled.packTier,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to verify pack payment.");
  }
}
