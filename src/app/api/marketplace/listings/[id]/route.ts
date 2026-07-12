import { requireSessionWallet } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { cancelListing } from "@/lib/db/listings";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const walletAddress = await requireSessionWallet();
    const { id } = await context.params;
    await cancelListing({ walletAddress, listingId: id });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to cancel listing.");
  }
}
