import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Receipt,
  RefreshCcw,
  Coins,
  Activity,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-accent)]/60 to-transparent" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
            <Activity className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight">FlowBack</span>
            <span className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
              on XRPL
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/buyer/wallet">
            <Button variant="ghost" size="sm">
              <Wallet className="h-3.5 w-3.5" />
              Buyer
            </Button>
          </Link>
          <Link href="/seller/dashboard">
            <Button variant="ghost" size="sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Seller
            </Button>
          </Link>
          <a
            href="https://github.com/ymjoo12/flowback"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:block"
          >
            <Button variant="outline" size="sm">
              GitHub
            </Button>
          </a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-14 pb-12">
        <Badge tone="accent" className="mb-5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
          KFIP 2026 · XRPL Track
        </Badge>
        <h1 className="text-balance text-[42px] font-semibold leading-[1.05] tracking-tight md:text-[56px]">
          결제 이후의 가치 흐름을
          <br />
          <span className="text-[color:var(--color-accent)]">하나의 월렛</span>으로 연결합니다.
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[color:var(--color-fg-muted)]">
          글로벌 커머스 거래 이후 발생하는 부분 환불·반품·보상·재구매 혜택을 XRPL Escrow와 RLUSD
          스테이블코인으로 묶어, 구매자와 셀러 모두에게 예측 가능한 정산 경험을 제공합니다.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <Link href="/buyer/wallet">
            <Button size="lg">
              구매자 데모 시작 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/seller/dashboard">
            <Button variant="secondary" size="lg">
              셀러 대시보드 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="환불 처리 시간" value="3~5초" hint="XRPL ledger close" />
          <Metric label="평균 수수료" value="< $0.0001" hint="per tx" />
          <Metric label="대상 셀러" value="K-커머스" hint="해외 직판 SMB" />
          <Metric label="진행 단계" value="MVP 개발" hint="2026 Q2 PoC" />
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            title="주문별 정산 상태"
            description="결제, 배송, 부분환불, 보상, 재구매까지 한 화면에서 추적합니다."
          />
          <Feature
            icon={RefreshCcw}
            title="부분 환불·보상"
            description="품절·지연 발생 시 XRP·RLUSD로 즉시 정산하고, 카드 환불의 D+2~5를 제거합니다."
          />
          <Feature
            icon={Coins}
            title="재구매 연계 월렛"
            description="환불금과 보상을 한 잔액으로 모아 다음 구매에서 즉시 사용합니다."
          />
          <Feature
            icon={Receipt}
            title="셀러 정산 대시보드"
            description="환불 예정·보상 지급·재구매 전환을 단일 운영 화면으로 통합합니다."
          />
          <Feature
            icon={Activity}
            title="투명한 거래 기록"
            description="모든 EscrowCreate/Finish/Payment를 testnet.xrpl.org에서 검증 가능합니다."
          />
          <Feature
            icon={Wallet}
            title="XRPL native Escrow"
            description="별도 스마트컨트랙트 없이 ledger-level Escrow로 정산 자금을 락업·해제합니다."
          />
        </div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-[color:var(--color-border)] px-6 py-6 text-xs text-[color:var(--color-fg-subtle)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 HYBLOCK · FlowBack · KFIP 2026 submission</span>
          <span>XRPL Testnet · RLUSD issuer rQhWct2…iLKV</span>
        </div>
      </footer>
    </main>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular text-[color:var(--color-fg)]">
        {value}
      </div>
      <div className="text-[11px] text-[color:var(--color-fg-muted)]">{hint}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-5 transition-colors hover:border-[color:var(--color-border-strong)]">
      <div className="mb-3 inline-grid h-8 w-8 place-items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <Icon className="h-4 w-4 text-[color:var(--color-accent)]" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
        {description}
      </p>
    </div>
  );
}
