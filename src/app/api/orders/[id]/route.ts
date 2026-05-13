import { NextResponse } from "next/server";
import { loadOrderDetail } from "@/lib/orders";
import { toErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    return NextResponse.json(loadOrderDetail(orderId));
  } catch (err) {
    const { message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
