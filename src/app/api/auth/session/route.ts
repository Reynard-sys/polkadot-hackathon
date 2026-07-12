import { readSessionWallet } from "@/lib/session";

export async function GET() {
  const walletAddress = await readSessionWallet();
  return Response.json({
    walletAddress,
    isAuthenticated: Boolean(walletAddress),
  });
}
