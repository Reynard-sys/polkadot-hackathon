import { z } from "zod";
import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createMarketplaceCheckout } from "@/lib/db/listings";
import { paymentAssetSchema } from "@/lib/stellar/validation";

const requestSchema = z.object({
  listingId: z.string().min(1),
  paymentAsset: paymentAssetSchema,
});

export async function POST(request: Request) {
  try {
    const walletAddress = await requireSessionWallet();
    const body = requestSchema.parse(await request.json());
    const checkout = await createMarketplaceCheckout({
      walletAddress,
      listingId: body.listingId,
      paymentAsset: body.paymentAsset,
    });

    return Response.json({
      checkoutId: checkout.checkoutId,
      recipient: checkout.recipient,
      amount: checkout.amount,
      asset: body.paymentAsset,
      memo: checkout.memo,
      phpEquivalent: checkout.phpEquivalent,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create marketplace checkout.");
  }
}
