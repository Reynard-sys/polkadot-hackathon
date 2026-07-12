import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
