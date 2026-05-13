import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { queries } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ orders: queries.listOrders() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { totalXrp?: string; note?: string };
  if (!body.totalXrp) {
    return NextResponse.json({ error: "totalXrp is required" }, { status: 400 });
  }
  try {
    const detail = await createOrder({ totalXrp: body.totalXrp, note: body.note });
    return NextResponse.json(detail, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
