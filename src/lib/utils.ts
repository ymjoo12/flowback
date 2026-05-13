import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shorten(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatAmount(value: number | string, decimals = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function explorerTxUrl(hash: string, network: "testnet" | "mainnet" = "testnet"): string {
  return network === "mainnet"
    ? `https://livenet.xrpl.org/transactions/${hash}`
    : `https://testnet.xrpl.org/transactions/${hash}`;
}

export function explorerAccountUrl(addr: string, network: "testnet" | "mainnet" = "testnet"): string {
  return network === "mainnet"
    ? `https://livenet.xrpl.org/accounts/${addr}`
    : `https://testnet.xrpl.org/accounts/${addr}`;
}
