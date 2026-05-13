import { Lock, RefreshCcw, Gift, CheckCircle2 } from "lucide-react";
import { TxLink } from "@/components/TxLink";
import type { SettlementRow } from "@/lib/db";

const KIND_META: Record<
  SettlementRow["kind"],
  { label: string; icon: typeof Lock; tone: string }
> = {
  escrow_create: { label: "Escrow 락업", icon: Lock, tone: "var(--color-accent)" },
  escrow_finish: { label: "Escrow 해제", icon: CheckCircle2, tone: "var(--color-success)" },
  refund: { label: "부분 환불", icon: RefreshCcw, tone: "var(--color-warn)" },
  reward: { label: "보상 지급", icon: Gift, tone: "var(--color-brand)" },
};

export function OrderTimeline({ settlements }: { settlements: SettlementRow[] }) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[color:var(--color-border)] px-4 py-8 text-center text-xs text-[color:var(--color-fg-subtle)]">
        아직 정산 기록이 없습니다.
      </div>
    );
  }
  return (
    <ol className="relative space-y-3 pl-5">
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-[color:var(--color-border)]" />
      {settlements.map((s) => {
        const meta = KIND_META[s.kind];
        const Icon = meta.icon;
        return (
          <li key={s.id} className="relative">
            <span
              className="absolute -left-[14px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-[color:var(--color-bg)] ring-1 ring-[color:var(--color-border-strong)]"
              style={{ color: meta.tone }}
            >
              <Icon className="h-2.5 w-2.5" />
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-medium">{meta.label}</div>
              <div className="tabular text-xs text-[color:var(--color-fg-muted)]">
                {s.amount} {s.currency}
              </div>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-[color:var(--color-fg-subtle)]">
              <span>{s.created_at} UTC</span>
              <TxLink hash={s.tx_hash} />
            </div>
            {s.note && (
              <div className="mt-1 text-[11px] text-[color:var(--color-fg-muted)]">{s.note}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
