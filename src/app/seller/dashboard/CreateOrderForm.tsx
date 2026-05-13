"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateOrderForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("K-뷰티 세트 주문");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ totalXrp: amount, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      router.refresh();
      router.push(`/seller/orders/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="결제 금액 (XRP)">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm tabular focus:border-[color:var(--color-accent)] focus:outline-none"
          disabled={disabled || submitting}
        />
      </Field>
      <Field label="주문 메모 (선택)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2.5 py-1.5 text-sm focus:border-[color:var(--color-accent)] focus:outline-none"
          disabled={disabled || submitting}
        />
      </Field>
      <Button onClick={submit} disabled={disabled || submitting} className="w-full">
        {submitting ? "Escrow 트랜잭션 제출 중…" : "EscrowCreate으로 주문 생성"}
      </Button>
      {error && <div className="text-xs text-[color:var(--color-danger)]">{error}</div>}
    </div>
  );
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
