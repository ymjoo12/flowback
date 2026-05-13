import Link from "next/link";
import { ArrowUpRight, TrendingUp, RefreshCcw, Gift, Receipt } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountLink } from "@/components/TxLink";
import { CreateOrderForm } from "./CreateOrderForm";
import { loadSellerWallet, getXrpBalance } from "@/lib/xrpl/wallets";
import { getRlusdBalance } from "@/lib/xrpl/token";
import { queries } from "@/lib/db";
import { formatAmount } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  let sellerAddress = "";
  let xrp = "0";
  let rlusd = "0";
  let envError: string | null = null;
  try {
    const wallet = loadSellerWallet();
    sellerAddress = wallet.classicAddress;
    const [xrpBal, rlusdBal] = await Promise.all([
      getXrpBalance(sellerAddress),
      getRlusdBalance(sellerAddress),
    ]);
    xrp = xrpBal;
    rlusd = rlusdBal.balance;
  } catch (err) {
    envError = err instanceof Error ? err.message : String(err);
  }

  const orders = sellerAddress ? queries.listOrdersBySeller(sellerAddress) : [];

  let totalEscrowed = 0;
  let totalRefunded = 0;
  let totalRewarded = 0;
  for (const o of orders) {
    if (o.status === "escrowed") totalEscrowed += Number(o.total_xrp);
    const settlements = queries.listSettlements(o.id);
    totalRefunded += settlements
      .filter((s) => s.kind === "refund")
      .reduce((a, s) => a + Number(s.amount), 0);
    totalRewarded += settlements
      .filter((s) => s.kind === "reward")
      .reduce((a, s) => a + Number(s.amount), 0);
  }
  const conversionRate = orders.length === 0 ? 0 : Math.min(100, Math.round((totalRewarded / Math.max(totalEscrowed, 1)) * 100));

  return (
    <>
      <Topbar scope="seller" />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        {envError && <EnvErrorBanner message={envError} />}

        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="accent">HYBLOCK · Seller View</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">셀러 정산 대시보드</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              락업된 결제금·환불 예정·보상 지급을 한 화면에서 관리합니다.
            </p>
          </div>
          {sellerAddress && (
            <div className="text-right text-xs text-[color:var(--color-fg-muted)]">
              <div>셀러 지갑</div>
              <AccountLink address={sellerAddress} />
              <div className="mt-1 tabular">
                XRP {formatAmount(xrp, 2)} · RLUSD {formatAmount(rlusd, 2)}
              </div>
            </div>
          )}
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="락업된 결제" value={`${formatAmount(totalEscrowed, 2)} XRP`} icon={TrendingUp} />
          <Metric label="누적 환불" value={`${formatAmount(totalRefunded, 2)} XRP`} icon={RefreshCcw} />
          <Metric label="누적 보상" value={`${formatAmount(totalRewarded, 2)} RLUSD`} icon={Gift} />
          <Metric label="재구매 전환(데모)" value={`${conversionRate}%`} icon={Receipt} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>최근 주문</CardTitle>
              <span className="text-xs text-[color:var(--color-fg-muted)]">총 {orders.length}건</span>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="rounded-md border border-dashed border-[color:var(--color-border)] px-4 py-8 text-center text-xs text-[color:var(--color-fg-subtle)]">
                  아직 주문이 없습니다. 오른쪽 패널에서 데모 주문을 생성하세요.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="border-b border-[color:var(--color-border)] text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                    <tr>
                      <th className="py-2 text-left">ID</th>
                      <th className="py-2 text-left">상태</th>
                      <th className="py-2 text-right">결제액</th>
                      <th className="py-2 text-right">Escrow Seq</th>
                      <th className="py-2 text-right">생성</th>
                      <th className="py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-[color:var(--color-border)] last:border-0">
                        <td className="py-2 font-medium">#{o.id}</td>
                        <td className="py-2">
                          <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                        </td>
                        <td className="py-2 text-right tabular">{formatAmount(o.total_xrp, 2)}</td>
                        <td className="py-2 text-right tabular text-[color:var(--color-fg-muted)]">
                          {o.escrow_sequence ?? "-"}
                        </td>
                        <td className="py-2 text-right text-[color:var(--color-fg-muted)]">
                          {o.created_at}
                        </td>
                        <td className="py-2 text-right">
                          <Link href={`/seller/orders/${o.id}`}>
                            <Button variant="ghost" size="sm">
                              처리 <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>데모 주문 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateOrderForm disabled={!sellerAddress} />
              <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--color-fg-muted)]">
                BUYER 지갑이 입력 금액만큼 XRP를 EscrowCreate 트랜잭션으로 락업합니다. 트랜잭션은 즉시
                XRPL Testnet에 제출됩니다.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            {label}
          </div>
          <div className="mt-1.5 text-xl font-semibold tabular">{value}</div>
        </div>
        <Icon className="h-4 w-4 text-[color:var(--color-fg-subtle)]" />
      </CardContent>
    </Card>
  );
}

function EnvErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-md border border-[color:var(--color-warn)]/40 bg-[color:var(--color-warn)]/10 px-4 py-3 text-sm text-[color:var(--color-warn)]">
      <div className="font-semibold">셀러 지갑이 설정되지 않았습니다.</div>
      <p className="mt-1 text-xs">
        `pnpm setup:wallets`를 실행하고 출력된 SEED를 `.env`에 복사하세요. ({message})
      </p>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "escrowed":
      return "결제 락업";
    case "partially_refunded":
      return "부분 환불";
    case "completed":
      return "정산 완료";
    case "fully_refunded":
      return "전액 환불";
    default:
      return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "escrowed":
      return "accent" as const;
    case "partially_refunded":
      return "warn" as const;
    case "completed":
      return "success" as const;
    case "fully_refunded":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}
