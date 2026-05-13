import { Wallet } from "xrpl";
import type { Payment, TrustSet, TxResponse, AccountLinesResponse } from "xrpl";
import { withClient } from "./client";
import { RLUSD_CURRENCY_HEX, resolveRlusdIssuer } from "./network";

export interface TrustlineInput {
  account: Wallet;
  limit?: string;
}

export async function ensureRlusdTrustline(input: TrustlineInput): Promise<string> {
  const issuer = resolveRlusdIssuer();
  if (input.account.classicAddress === issuer) return "issuer";
  return withClient(async (client) => {
    const tx: TrustSet = {
      TransactionType: "TrustSet",
      Account: input.account.classicAddress,
      LimitAmount: {
        currency: RLUSD_CURRENCY_HEX,
        issuer,
        value: input.limit ?? "1000000000",
      },
    };
    const prepared = await client.autofill(tx);
    const signed = input.account.sign(prepared);
    const result = (await client.submitAndWait(signed.tx_blob)) as TxResponse;
    assertSuccess(result, "TrustSet");
    return signed.hash;
  });
}

export interface RlusdPaymentInput {
  sender: Wallet;
  destination: string;
  amount: string;
  destinationTag?: number;
}

export async function sendRlusd(input: RlusdPaymentInput): Promise<string> {
  const issuer = resolveRlusdIssuer();
  return withClient(async (client) => {
    const tx: Payment = {
      TransactionType: "Payment",
      Account: input.sender.classicAddress,
      Destination: input.destination,
      Amount: {
        currency: RLUSD_CURRENCY_HEX,
        issuer,
        value: input.amount,
      },
    };
    if (typeof input.destinationTag === "number") tx.DestinationTag = input.destinationTag;
    const prepared = await client.autofill(tx);
    const signed = input.sender.sign(prepared);
    const result = (await client.submitAndWait(signed.tx_blob)) as TxResponse;
    assertSuccess(result, "Payment");
    return signed.hash;
  });
}

export interface RlusdBalance {
  balance: string;
  limit: string;
  hasTrustline: boolean;
  isIssuer: boolean;
}

export async function getRlusdBalance(address: string): Promise<RlusdBalance> {
  return withClient(async (client) => {
    const issuer = resolveRlusdIssuer();
    if (address === issuer) {
      const lines = (await client.request({
        command: "account_lines",
        account: address,
        ledger_index: "validated",
      })) as AccountLinesResponse;
      const issued = lines.result.lines
        .filter((l) => l.currency === RLUSD_CURRENCY_HEX)
        .reduce((sum, line) => sum + Math.max(0, -Number(line.balance)), 0);
      return {
        balance: issued.toString(),
        limit: "issuer",
        hasTrustline: true,
        isIssuer: true,
      };
    }
    const lines = (await client.request({
      command: "account_lines",
      account: address,
      peer: issuer,
      ledger_index: "validated",
    })) as AccountLinesResponse;
    const line = lines.result.lines.find(
      (l) => l.currency === RLUSD_CURRENCY_HEX && l.account === issuer,
    );
    if (!line) return { balance: "0", limit: "0", hasTrustline: false, isIssuer: false };
    return { balance: line.balance, limit: line.limit, hasTrustline: true, isIssuer: false };
  });
}

function assertSuccess(result: TxResponse, kind: string): void {
  const meta = result.result.meta;
  const code =
    typeof meta === "object" && meta !== null && "TransactionResult" in meta
      ? (meta as { TransactionResult: string }).TransactionResult
      : "unknown";
  if (code !== "tesSUCCESS") {
    throw new Error(`${kind} failed: ${code}`);
  }
}
