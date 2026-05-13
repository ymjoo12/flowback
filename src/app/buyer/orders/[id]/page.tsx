import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/OrderTimeline";
import { AccountLink } from "@/components/TxLink";
import { loadOrderDetail } from "@/lib/orders";
import { formatAmount } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BuyerOrderDetailPage({
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
      <Topbar scope="buyer" />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link
          href="/buyer/wallet"
          className="mb-4 inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ChevronLeft className="h-3 w-3" />
          월렛으로 돌아가기
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="accent">주문 #{order.id}</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">주문 정산 타임라인</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              모든 트랜잭션은 testnet.xrpl.org에서 검증할 수 있습니다.
            </p>
          </div>
          <div className="text-right text-xs text-[color:var(--color-fg-muted)]">
            <div>
              생성: <span className="tabular text-[color:var(--color-fg)]">{order.created_at}</span> UTC
            </div>
            <div className="mt-0.5">상태: {order.status}</div>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="결제 총액" value={`${formatAmount(order.total_xrp, 2)} XRP`} />
          <Metric label="셀러 수령" value={`${formatAmount(effective.paidToSeller, 2)} XRP`} />
          <Metric label="환불액" value={`${formatAmount(effective.refundedToBuyer, 2)} XRP`} />
          <Metric label="보상 RLUSD" value={`${formatAmount(effective.rewardedToBuyer, 2)}`} />
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
              <CardTitle>거래 참여자</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                  Buyer
                </div>
                <AccountLink address={order.buyer_address} />
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                  Seller
                </div>
                <AccountLink address={order.seller_address} />
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                  Escrow Sequence
                </div>
                <div className="tabular text-[color:var(--color-fg)]">
                  {order.escrow_sequence ?? "-"}
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
