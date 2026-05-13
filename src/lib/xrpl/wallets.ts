import { Wallet, dropsToXrp } from "xrpl";
import type { AccountInfoResponse } from "xrpl";
import { withClient } from "./client";

export interface WalletEnv {
  sellerSeed?: string;
  buyerSeed?: string;
}

function readSeeds(env: NodeJS.ProcessEnv = process.env): WalletEnv {
  return {
    sellerSeed: env.SELLER_SEED,
    buyerSeed: env.BUYER_SEED,
  };
}

export function loadSellerWallet(): Wallet {
  const { sellerSeed } = readSeeds();
  if (!sellerSeed) {
    throw new Error("SELLER_SEED missing — run `pnpm setup:wallets` and copy seeds into .env");
  }
  return Wallet.fromSeed(sellerSeed);
}

export function loadBuyerWallet(): Wallet {
  const { buyerSeed } = readSeeds();
  if (!buyerSeed) {
    throw new Error("BUYER_SEED missing — run `pnpm setup:wallets` and copy seeds into .env");
  }
  return Wallet.fromSeed(buyerSeed);
}

export async function fundFromFaucet(wallet?: Wallet): Promise<{ wallet: Wallet; xrpBalance: string }> {
  return withClient(async (client) => {
    const result = await client.fundWallet(wallet ?? null);
    return { wallet: result.wallet, xrpBalance: result.balance.toString() };
  });
}

export async function getXrpBalance(address: string): Promise<string> {
  return withClient(async (client) => {
    try {
      const res = (await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      })) as AccountInfoResponse;
      return dropsToXrp(res.result.account_data.Balance).toString();
    } catch (err) {
      const code = (err as { data?: { error?: string } })?.data?.error;
      if (code === "actNotFound") return "0";
      throw err;
    }
  });
}
