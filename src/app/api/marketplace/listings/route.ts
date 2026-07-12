import { z } from "zod";
import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { createListing, getActiveListings } from "@/lib/db/listings";
import { hasDatabaseUrl } from "@/lib/server-env";
import { paymentAssetSchema } from "@/lib/stellar/validation";

const createSchema = z.object({
  cardInstanceId: z.string().min(1),
  priceAsset: paymentAssetSchema,
  priceAmount: z.string().trim().regex(/^\d+(\.\d{1,7})?$/).refine((value) => Number(value) > 0, "Price must be greater than zero."),
});

export async function GET() {
  try {
    if (!hasDatabaseUrl()) {
      return Response.json({
        listings: [],
        unavailable: true,
        error: "Marketplace is unavailable until DATABASE_URL is configured.",
      });
    }
    const listings = await getActiveListings();
    return Response.json({ listings });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load marketplace listings.");
  }
}

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl()) {
      return jsonError(
        "Marketplace listings require a configured database. Add DATABASE_URL first.",
        503,
      );
    }
    const walletAddress = await requireSessionWallet();
    const body = createSchema.parse(await request.json());
    const listing = await createListing({
      walletAddress,
      cardInstanceId: body.cardInstanceId,
      priceAsset: body.priceAsset,
      priceAmount: body.priceAmount,
    });
    return Response.json({ listing });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create listing.");
  }
}
