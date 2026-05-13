import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { AccountLink } from "@/components/TxLink";
import { SellerActions } from "./SellerActions";
import { loadOrderDetail } from "@/lib/orders";
import { formatAmount } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SellerOrderProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();
  let detail;
  try {
    detail = loadOrderDetail(orderId);
  } catch {
    notFound();
  }
  const { order, settlements, effective } = detail;

  return (
    <>
      <Topbar scope="seller" />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link
          href="/seller/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ChevronLeft className="h-3 w-3" />
          대시보드로 돌아가기
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="accent">주문 #{order.id}</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">주문 처리</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              부분 환불·보상 지급 트랜잭션을 XRPL Testnet에 직접 제출합니다.
            </p>
          </div>
          <div className="text-right text-xs text-[color:var(--color-fg-muted)]">
            <div>상태</div>
            <div className="text-base text-[color:var(--color-fg)]">{order.status}</div>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="결제 락업" value={`${formatAmount(order.total_xrp, 2)} XRP`} />
          <Metric label="셀러 수령(현재)" value={`${formatAmount(effective.paidToSeller, 2)} XRP`} />
          <Metric label="환불 누적" value={`${formatAmount(effective.refundedToBuyer, 2)} XRP`} />
          <Metric label="보상 누적" value={`${formatAmount(effective.rewardedToBuyer, 2)} RLUSD`} />
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>정산 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline settlements={settlements} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>액션</CardTitle>
            </CardHeader>
            <CardContent>
              <SellerActions
                orderId={order.id}
                totalXrp={order.total_xrp}
                status={order.status}
              />
              <div className="mt-4 space-y-2 border-t border-[color:var(--color-border)] pt-3 text-[11px] text-[color:var(--color-fg-muted)]">
                <div>
                  <span className="text-[color:var(--color-fg-subtle)]">Buyer:</span>{" "}
                  <AccountLink address={order.buyer_address} />
                </div>
                <div>
                  <span className="text-[color:var(--color-fg-subtle)]">Seller:</span>{" "}
                  <AccountLink address={order.seller_address} />
                </div>
                <div>
                  <span className="text-[color:var(--color-fg-subtle)]">Escrow Seq:</span>{" "}
                  <span className="tabular text-[color:var(--color-fg)]">
                    {order.escrow_sequence ?? "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold tabular">{value}</div>
    </div>
  );
}
