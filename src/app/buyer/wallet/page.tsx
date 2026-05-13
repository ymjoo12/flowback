import Link from "next/link";
import { ArrowUpRight, Wallet as WalletIcon, RefreshCcw, Gift } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountLink } from "@/components/TxLink";
import { loadBuyerWallet } from "@/lib/xrpl/wallets";
import { getXrpBalance } from "@/lib/xrpl/wallets";
import { getRlusdBalance } from "@/lib/xrpl/token";
import { queries } from "@/lib/db";
import { formatAmount } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BuyerWalletPage() {
  let buyerAddress = "";
  let xrp = "0";
  let rlusd = "0";
  let trustlineOpen = false;
  let envError: string | null = null;
  try {
    const wallet = loadBuyerWallet();
    buyerAddress = wallet.classicAddress;
    const [xrpBal, rlusdBal] = await Promise.all([
      getXrpBalance(buyerAddress),
      getRlusdBalance(buyerAddress),
    ]);
    xrp = xrpBal;
    rlusd = rlusdBal.balance;
    trustlineOpen = rlusdBal.hasTrustline;
  } catch (err) {
    envError = err instanceof Error ? err.message : String(err);
  }

  const orders = buyerAddress ? queries.listOrdersByBuyer(buyerAddress) : [];
  const totalRefund = orders.reduce((sum, o) => {
    const settlements = queries.listSettlements(o.id);
    return (
      sum +
      settlements.filter((s) => s.kind === "refund").reduce((a, s) => a + Number(s.amount), 0)
    );
  }, 0);
  const totalReward = orders.reduce((sum, o) => {
    const settlements = queries.listSettlements(o.id);
    return (
      sum +
      settlements.filter((s) => s.kind === "reward").reduce((a, s) => a + Number(s.amount), 0)
    );
  }, 0);

  return (
    <>
      <Topbar scope="buyer" />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        {envError && <EnvErrorBanner message={envError} />}

        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Badge tone="accent">XRPL Testnet</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">구매자 월렛</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
              한국 셀러 주문의 결제·환불·보상을 한 잔액으로 모아 다음 구매에 즉시 사용합니다.
            </p>
          </div>
          {buyerAddress && (
            <div className="text-right text-xs text-[color:var(--color-fg-muted)]">
              <div>지갑 주소</div>
              <AccountLink address={buyerAddress} />
            </div>
          )}
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <BalanceCard
            label="XRP 잔액"
            value={`${formatAmount(xrp, 4)} XRP`}
            icon={WalletIcon}
            hint="네트워크: testnet"
          />
          <BalanceCard
            label="RLUSD 잔액"
            value={`${formatAmount(rlusd, 2)} RLUSD`}
            icon={Gift}
            hint={trustlineOpen ? "Trust Line 활성" : "Trust Line 미설정"}
          />
          <BalanceCard
            label="누적 환불 + 보상"
            value={`${formatAmount(totalRefund + totalReward, 2)} XRP·RLUSD`}
            icon={RefreshCcw}
            hint={`환불 ${formatAmount(totalRefund, 2)} · 보상 ${formatAmount(totalReward, 2)}`}
          />
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold">최근 주문</h2>
            <span className="text-xs text-[color:var(--color-fg-muted)]">
              총 {orders.length}건
            </span>
          </div>
          {orders.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-[color:var(--color-fg-muted)]">
                  주문이 없습니다. 셀러 대시보드에서 주문을 생성하세요.
                </p>
                <Link
                  href="/seller/dashboard"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-[color:var(--color-accent)] hover:underline"
                >
                  셀러 대시보드로 이동 <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {orders.map((o) => (
                <Link key={o.id} href={`/buyer/orders/${o.id}`}>
                  <Card className="transition-colors hover:border-[color:var(--color-border-strong)]">
                    <CardHeader className="flex-row items-center justify-between">
                      <div>
                        <CardTitle>주문 #{o.id}</CardTitle>
                        <CardDescription>{o.created_at} UTC</CardDescription>
                      </div>
                      <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-[color:var(--color-fg-muted)]">결제 락업</span>
                        <span className="tabular font-medium">{formatAmount(o.total_xrp, 2)} XRP</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function BalanceCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof WalletIcon;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
            {label}
          </div>
          <div className="mt-1.5 text-xl font-semibold tabular">{value}</div>
          <div className="text-[11px] text-[color:var(--color-fg-muted)]">{hint}</div>
        </div>
        <Icon className="h-4 w-4 text-[color:var(--color-fg-subtle)]" />
      </CardContent>
    </Card>
  );
}

function EnvErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-md border border-[color:var(--color-warn)]/40 bg-[color:var(--color-warn)]/10 px-4 py-3 text-sm text-[color:var(--color-warn)]">
      <div className="font-semibold">지갑이 설정되지 않았습니다.</div>
      <p className="mt-1 text-xs">
        `pnpm setup:wallets`를 실행하고 출력된 SEED를 `.env`에 복사한 뒤 다시 로드하세요. ({message})
      </p>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "escrowed":
      return "결제 락업";
    case "partially_refunded":
      return "부분 환불 완료";
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
