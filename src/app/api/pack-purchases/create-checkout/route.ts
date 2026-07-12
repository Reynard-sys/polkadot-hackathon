import { z } from "zod";
import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createPackCheckout } from "@/lib/db/purchases";
import { getPlatformStellarAddress } from "@/lib/server-env";
import { paymentAssetSchema, packTierSchema } from "@/lib/stellar/validation";

const requestSchema = z.object({
  seriesOrDropId: z.string().min(1),
  packTier: packTierSchema,
  paymentAsset: paymentAssetSchema,
});

export async function POST(request: Request) {
  try {
    const walletAddress = await requireSessionWallet();
    const body = requestSchema.parse(await request.json());
    const result = await createPackCheckout({
      walletAddress,
      seriesOrDropId: body.seriesOrDropId,
      packTier: body.packTier,
      paymentAsset: body.paymentAsset,
    });

    return Response.json({
      checkoutId: result.purchase.id,
      recipient: getPlatformStellarAddress(),
      amount: result.amount,
      asset: body.paymentAsset,
      memo: result.memo,
      phpEquivalent: result.phpEquivalent,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create pack checkout.");
  }
}
