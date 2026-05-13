import { Wallet, xrpToDrops, isoTimeToRippleTime } from "xrpl";
import type { EscrowCreate, EscrowFinish, EscrowCancel, TxResponse } from "xrpl";
import { withClient } from "./client";

export interface EscrowCreateInput {
  sender: Wallet;
  destination: string;
  amountXrp: string;
  destinationTag?: number;
  cancelAfterUnix?: number;
  finishAfterUnix?: number;
}

export interface EscrowCreateResult {
  txHash: string;
  offerSequence: number;
}

export async function createEscrow(input: EscrowCreateInput): Promise<EscrowCreateResult> {
  return withClient(async (client) => {
    const tx: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: input.sender.classicAddress,
      Destination: input.destination,
      Amount: xrpToDrops(input.amountXrp),
    };
    if (typeof input.destinationTag === "number") tx.DestinationTag = input.destinationTag;
    if (typeof input.finishAfterUnix === "number") {
      tx.FinishAfter = unixToRippleTime(input.finishAfterUnix);
    }
    if (typeof input.cancelAfterUnix === "number") {
      tx.CancelAfter = unixToRippleTime(input.cancelAfterUnix);
    }

    const prepared = await client.autofill(tx);
    const signed = input.sender.sign(prepared);
    const result = (await client.submitAndWait(signed.tx_blob)) as TxResponse;
    assertSuccess(result, "EscrowCreate");

    const sequence =
      (result.result as unknown as { Sequence?: number }).Sequence ??
      (prepared.Sequence as number | undefined);
    if (typeof sequence !== "number") {
      throw new Error("EscrowCreate succeeded but Sequence is missing from response");
    }
    return { txHash: signed.hash, offerSequence: sequence };
  });
}

export interface EscrowFinishInput {
  signer: Wallet;
  owner: string;
  offerSequence: number;
}

export async function finishEscrow(input: EscrowFinishInput): Promise<string> {
  return withClient(async (client) => {
    const tx: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: input.signer.classicAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence,
    };
    const prepared = await client.autofill(tx);
    const signed = input.signer.sign(prepared);
    const result = (await client.submitAndWait(signed.tx_blob)) as TxResponse;
    assertSuccess(result, "EscrowFinish");
    return signed.hash;
  });
}

export interface EscrowCancelInput {
  signer: Wallet;
  owner: string;
  offerSequence: number;
}

export async function cancelEscrow(input: EscrowCancelInput): Promise<string> {
  return withClient(async (client) => {
    const tx: EscrowCancel = {
      TransactionType: "EscrowCancel",
      Account: input.signer.classicAddress,
      Owner: input.owner,
      OfferSequence: input.offerSequence,
    };
    const prepared = await client.autofill(tx);
    const signed = input.signer.sign(prepared);
    const result = (await client.submitAndWait(signed.tx_blob)) as TxResponse;
    assertSuccess(result, "EscrowCancel");
    return signed.hash;
  });
}

function unixToRippleTime(unix: number): number {
  return isoTimeToRippleTime(new Date(unix * 1000).toISOString());
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
