import { ExternalLink } from "lucide-react";
import { explorerAccountUrl, explorerTxUrl, shorten } from "@/lib/utils";

type Network = "testnet" | "mainnet";

export function TxLink({
  hash,
  network = "testnet",
  className,
}: {
  hash: string;
  network?: Network;
  className?: string;
}) {
  return (
    <a
      href={explorerTxUrl(hash, network)}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1 font-mono text-xs text-[color:var(--color-accent)] hover:underline ${className ?? ""}`}
    >
      {shorten(hash, 8, 6)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function AccountLink({
  address,
  network = "testnet",
  className,
}: {
  address: string;
  network?: Network;
  className?: string;
}) {
  return (
    <a
      href={explorerAccountUrl(address, network)}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1 font-mono text-xs text-[color:var(--color-accent)] hover:underline ${className ?? ""}`}
    >
      {shorten(address)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
