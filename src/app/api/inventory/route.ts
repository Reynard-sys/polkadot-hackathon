import { getInventoryForWallet, migrateLegacyInventory } from "@/lib/db/inventory";
import { jsonError } from "@/lib/api";
import { requireSessionWallet } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/server-env";

export async function GET() {
  try {
    if (!hasDatabaseUrl()) {
      return jsonError(
        "Backend inventory is unavailable until DATABASE_URL is configured.",
        503,
      );
    }
    const walletAddress = await requireSessionWallet();
    const items = await getInventoryForWallet(walletAddress);
    return Response.json({ items });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load inventory.", 401);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl()) {
      return jsonError(
        "Legacy import requires a configured database. Add DATABASE_URL first.",
        503,
      );
    }
    const walletAddress = await requireSessionWallet();
    const body = (await request.json()) as { tokenIds?: number[] };
    const tokenIds = Array.isArray(body.tokenIds) ? body.tokenIds : [];
    await migrateLegacyInventory(walletAddress, tokenIds);
    const items = await getInventoryForWallet(walletAddress);
    return Response.json({ items });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to migrate legacy inventory.");
  }
}
