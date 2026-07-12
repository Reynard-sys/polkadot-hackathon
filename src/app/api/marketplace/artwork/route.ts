import { z } from "zod";
import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { publishArtwork } from "@/lib/db/artwork";
import { hasDatabaseUrl } from "@/lib/server-env";
import { paymentAssetSchema } from "@/lib/stellar/validation";

const schema = z.object({
  title: z.string().trim().min(2).max(80),
  artistName: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional(),
  imageDataUrl: z
    .string()
    .max(2_100_000, "Artwork must be smaller than 1.5 MB.")
    .refine((value) => /^data:image\/(png|jpe?g|webp);base64,/i.test(value), "Upload a PNG, JPEG, or WebP image."),
  priceAsset: paymentAssetSchema,
  priceAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,7})?$/, "Enter a valid Stellar amount with up to 7 decimals.")
    .refine((value) => Number(value) > 0, "Price must be greater than zero."),
});

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl()) return jsonError("Artwork publishing requires a configured database.", 503);
    const walletAddress = await requireSessionWallet();
    const body = schema.parse(await request.json());
    const listing = await publishArtwork({ walletAddress, ...body });
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to publish artwork.");
  }
}
