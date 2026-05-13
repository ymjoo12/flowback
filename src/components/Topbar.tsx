import Link from "next/link";
import { FlowBackMark } from "@/components/FlowBackMark";

export function Topbar({ scope }: { scope: "buyer" | "seller" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <FlowBackMark className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight">FlowBack</span>
          <span className="rounded-full border border-[color:var(--color-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-muted)]">
            {scope}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-xs">
          <Link
            href="/buyer/wallet"
            className={`rounded-md px-2.5 py-1.5 ${scope === "buyer" ? "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-fg)]" : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"}`}
          >
            Buyer Wallet
          </Link>
          <Link
            href="/seller/dashboard"
            className={`rounded-md px-2.5 py-1.5 ${scope === "seller" ? "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-fg)]" : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"}`}
          >
            Seller Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
