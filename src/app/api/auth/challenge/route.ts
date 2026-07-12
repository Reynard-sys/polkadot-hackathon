import { z } from "zod";
import { issueWalletChallenge } from "@/lib/auth";
import { jsonError } from "@/lib/api";

const requestSchema = z.object({
  walletAddress: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await issueWalletChallenge(body.walletAddress);
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to issue auth challenge.");
  }
}
