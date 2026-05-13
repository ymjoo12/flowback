"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SellerActions({
  orderId,
  totalXrp,
  status,
}: {
  orderId: number;
  totalXrp: string;
  status: string;
}) {
  const router = useRouter();
  const [refundAmount, setRefundAmount] = useState("3");
  const [refundNote, setRefundNote] = useState("품절 상품 환불");
  const [rewardAmount, setRewardAmount] = useState("1");
  const [rewardNote, setRewardNote] = useState("배송 지연 보상");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = Number(totalXrp);
  const refundNum = Number(refundAmount);
  const keep = formatAmountInput(Math.max(0, total - refundNum));
  const canEditRefund = status === "escrowed" && busy === null;
  const canRefund =
    status === "escrowed" &&
    busy === null &&
    refundAmount.trim() !== "" &&
    Number.isFinite(total) &&
    Number.isFinite(refundNum) &&
    refundNum >= 0 &&
    refundNum <= total;

  async function partialRefund() {
    setBusy("refund");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/partial-refund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          keepXrp: keep,
          refundXrp: formatAmountInput(refundNum),
          note: refundNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function reward() {
    setBusy("reward");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/reward`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountRlusd: rewardAmount, note: rewardNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <Section title="부분 환불">
        <Field label="환불 금액 (XRP)">
          <input
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            inputMode="decimal"
            disabled={!canEditRefund}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm tabular focus:border-[color:var(--color-accent)] focus:outline-none disabled:opacity-50"
          />
        </Field>
        <Field label="사유">
          <input
            value={refundNote}
            onChange={(e) => setRefundNote(e.target.value)}
            disabled={!canEditRefund}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm focus:border-[color:var(--color-accent)] focus:outline-none disabled:opacity-50"
          />
        </Field>
        <div className="flex items-center justify-between text-[11px] text-[color:var(--color-fg-muted)]">
          <span>셀러 수령</span>
          <span className="tabular">{keep} XRP</span>
        </div>
        <Button
          onClick={partialRefund}
          disabled={!canRefund}
          className="w-full"
        >
          {busy === "refund" ? "트랜잭션 제출 중…" : "부분 환불 실행"}
        </Button>
        {!canRefund && status !== "escrowed" && (
          <p className="text-[11px] text-[color:var(--color-fg-subtle)]">
            현재 상태({status})에서는 환불을 실행할 수 없습니다.
          </p>
        )}
      </Section>

      <Section title="보상 지급">
        <Field label="지급 RLUSD">
          <input
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            inputMode="decimal"
            disabled={busy !== null}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm tabular focus:border-[color:var(--color-accent)] focus:outline-none disabled:opacity-50"
          />
        </Field>
        <Field label="사유">
          <input
            value={rewardNote}
            onChange={(e) => setRewardNote(e.target.value)}
            disabled={busy !== null}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm focus:border-[color:var(--color-accent)] focus:outline-none disabled:opacity-50"
          />
        </Field>
        <Button
          onClick={reward}
          variant="secondary"
          disabled={busy !== null}
          className="w-full"
        >
          {busy === "reward" ? "트랜잭션 제출 중…" : "보상 지급"}
        </Button>
      </Section>

      {error && (
        <div className="rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-xs text-[color:var(--color-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function formatAmountInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10.5px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        {label}
      </span>
      {children}
    </label>
  );
}
