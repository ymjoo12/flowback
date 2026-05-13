import { NextResponse } from "next/server";
import { payReward } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { amountRlusd?: string; note?: string };
  if (!body.amountRlusd) {
    return NextResponse.json({ error: "amountRlusd is required" }, { status: 400 });
  }
  try {
    const detail = await payReward({
      orderId,
      amountRlusd: body.amountRlusd,
      note: body.note,
    });
    return NextResponse.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
