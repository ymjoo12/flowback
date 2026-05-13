import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { queries } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ orders: queries.listOrders() });
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const body = (raw && typeof raw === "object" ? raw : {}) as {
    totalXrp?: string;
    note?: string;
  };
  if (!body.totalXrp) {
    return NextResponse.json({ error: "totalXrp is required" }, { status: 400 });
  }
  try {
    const detail = await createOrder({ totalXrp: body.totalXrp, note: body.note });
    return NextResponse.json(detail, { status: 201 });
  } catch (err) {
    const { message, status } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}
