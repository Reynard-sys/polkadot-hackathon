import { z } from "zod";
import { verifyWalletChallenge } from "@/lib/auth";
import { jsonError } from "@/lib/api";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await verifyWalletChallenge(body);
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to verify wallet signature.", 401);
  }
}
