import { NextResponse } from "next/server";
import { getXrpBalance } from "@/lib/xrpl/wallets";
import { getRlusdBalance } from "@/lib/xrpl/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ address: string }> },
) {
  const { address } = await ctx.params;
  if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) {
    return NextResponse.json({ error: "invalid xrpl address" }, { status: 400 });
  }
  try {
    const [xrp, rlusd] = await Promise.all([getXrpBalance(address), getRlusdBalance(address)]);
    return NextResponse.json({ address, xrp, rlusd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
