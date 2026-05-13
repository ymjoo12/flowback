import { loadBuyerWallet, loadSellerWallet } from "./xrpl/wallets";
import { createEscrow, finishEscrow } from "./xrpl/escrow";
import { ensureRlusdTrustline, getRlusdBalance, sendRlusd } from "./xrpl/token";
import { Client, xrpToDrops } from "xrpl";
import { resolveEndpoint } from "./xrpl/network";
import { queries, type OrderRow, type SettlementRow } from "./db";
import {
  assertBalancedRefund,
  parseNonNegativeAmount,
  parsePositiveAmount,
} from "./amounts";
import { AppError } from "./errors";

export const ESCROW_FINISH_DELAY_SECONDS = 10;
const ESCROW_FINISH_BUFFER_MS = 3000;
const MAX_ORDER_XRP = 100;
const MAX_REWARD_RLUSD = 100;

export interface CreateOrderInput {
  totalXrp: string;
  note?: string;
}

export interface OrderDetail {
  order: OrderRow;
  settlements: SettlementRow[];
  effective: {
    paidToSeller: number;
    refundedToBuyer: number;
    rewardedToBuyer: number;
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDetail> {
  const total = parsePositiveAmount(input.totalXrp, "totalXrp", MAX_ORDER_XRP);
  const seller = loadSellerWallet();
  const buyer = loadBuyerWallet();

  const now = Math.floor(Date.now() / 1000);
  const finishAfter = now + ESCROW_FINISH_DELAY_SECONDS;
  const insert = queries.insertOrder({
    buyer_address: buyer.classicAddress,
    seller_address: seller.classicAddress,
    total_xrp: total.text,
    status: "escrowed",
    escrow_owner: buyer.classicAddress,
    escrow_sequence: null,
    escrow_tx_hash: null,
    escrow_finish_after: finishAfter,
  });
  const orderId = Number(insert.lastInsertRowid);

  let result;
  try {
    result = await createEscrow({
      sender: buyer,
      destination: seller.classicAddress,
      amountXrp: total.text,
      destinationTag: orderId,
      finishAfterUnix: finishAfter,
      cancelAfterUnix: now + 60 * 60,
    });
  } catch (err) {
    queries.deleteOrder(orderId);
    throw err;
  }
  queries.updateOrderEscrow(orderId, result.offerSequence, result.txHash);
  queries.insertSettlement({
    order_id: orderId,
    kind: "escrow_create",
    amount: total.text,
    currency: "XRP",
    tx_hash: result.txHash,
    note: input.note ?? null,
  });
  return loadOrderDetail(orderId);
}

export interface PartialRefundInput {
  orderId: number;
  keepXrp: string;
  refundXrp: string;
  note?: string;
}

export async function executePartialRefund(input: PartialRefundInput): Promise<OrderDetail> {
  const order = queries.getOrder(input.orderId);
  if (!order) throw new AppError(`order ${input.orderId} not found`, 404);
  const settlements = queries.listSettlements(order.id);
  const hasEscrowFinish = settlements.some((s) => s.kind === "escrow_finish");
  const hasRefund = settlements.some((s) => s.kind === "refund");
  if (hasRefund) throw new AppError(`order ${input.orderId} already has a refund`, 409);
  if (order.status !== "escrowed" && !hasEscrowFinish) {
    throw new AppError(`order ${input.orderId} is in '${order.status}', cannot refund`, 409);
  }
  if (typeof order.escrow_sequence !== "number") {
    throw new AppError(`order ${input.orderId} has no escrow_sequence`, 409);
  }

  const total = parsePositiveAmount(order.total_xrp, "totalXrp", MAX_ORDER_XRP);
  const keep = parseNonNegativeAmount(input.keepXrp, "keepXrp", total.value);
  const refund = parseNonNegativeAmount(input.refundXrp, "refundXrp", total.value);
  assertBalancedRefund(total.value, keep.value, refund.value);

  const seller = loadSellerWallet();
  if (!hasEscrowFinish) {
    await waitUntilFinishable(order.escrow_finish_after);
    const finishHash = await finishEscrow({
      signer: seller,
      owner: order.escrow_owner,
      offerSequence: order.escrow_sequence,
    });
    queries.insertSettlement({
      order_id: order.id,
      kind: "escrow_finish",
      amount: order.total_xrp,
      currency: "XRP",
      tx_hash: finishHash,
      note: null,
    });
  }

  if (refund.value > 0) {
    const refundHash = await sendXrpPayment({
      from: seller,
      to: order.buyer_address,
      amountXrp: refund.text,
      destinationTag: order.id,
    });
    queries.insertSettlement({
      order_id: order.id,
      kind: "refund",
      amount: refund.text,
      currency: "XRP",
      tx_hash: refundHash,
      note: input.note ?? null,
    });
    queries.updateOrderStatus(order.id, keep.value === 0 ? "fully_refunded" : "partially_refunded");
  } else {
    queries.updateOrderStatus(order.id, "completed");
  }
  return loadOrderDetail(order.id);
}

export interface RewardInput {
  orderId: number;
  amountRlusd: string;
  note?: string;
}

export async function payReward(input: RewardInput): Promise<OrderDetail> {
  const order = queries.getOrder(input.orderId);
  if (!order) throw new AppError(`order ${input.orderId} not found`, 404);
  const amount = parsePositiveAmount(input.amountRlusd, "amountRlusd", MAX_REWARD_RLUSD);

  const seller = loadSellerWallet();
  const buyer = loadBuyerWallet();
  if (buyer.classicAddress === order.buyer_address) {
    const trustline = await getRlusdBalance(order.buyer_address);
    if (!trustline.hasTrustline) {
      await ensureRlusdTrustline({ account: buyer });
    }
  }
  const hash = await sendRlusd({
    sender: seller,
    destination: order.buyer_address,
    amount: amount.text,
    destinationTag: order.id,
  });
  queries.insertSettlement({
    order_id: order.id,
    kind: "reward",
    amount: amount.text,
    currency: "RLUSD",
    tx_hash: hash,
    note: input.note ?? null,
  });
  return loadOrderDetail(order.id);
}

export function loadOrderDetail(orderId: number): OrderDetail {
  const order = queries.getOrder(orderId);
  if (!order) throw new Error(`order ${orderId} not found`);
  const settlements = queries.listSettlements(orderId);
  let paidToSeller = 0;
  let refundedToBuyer = 0;
  let rewardedToBuyer = 0;
  for (const s of settlements) {
    const amount = Number(s.amount);
    if (s.kind === "escrow_finish") paidToSeller += amount;
    if (s.kind === "refund") {
      refundedToBuyer += amount;
      paidToSeller -= amount;
    }
    if (s.kind === "reward") rewardedToBuyer += amount;
  }
  return {
    order,
    settlements,
    effective: { paidToSeller, refundedToBuyer, rewardedToBuyer },
  };
}

interface XrpPaymentInput {
  from: ReturnType<typeof loadSellerWallet>;
  to: string;
  amountXrp: string;
  destinationTag?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilFinishable(finishAfter: number | null): Promise<void> {
  if (!finishAfter) return;
  const waitMs = finishAfter * 1000 - Date.now() + ESCROW_FINISH_BUFFER_MS;
  if (waitMs > 0) await sleep(waitMs);
}

async function sendXrpPayment(input: XrpPaymentInput): Promise<string> {
  const client = new Client(resolveEndpoint());
  await client.connect();
  try {
    const prepared = await client.autofill({
      TransactionType: "Payment",
      Account: input.from.classicAddress,
      Destination: input.to,
      Amount: xrpToDrops(input.amountXrp),
      ...(typeof input.destinationTag === "number"
        ? { DestinationTag: input.destinationTag }
        : {}),
    });
    const signed = input.from.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const meta = result.result.meta;
    const code =
      typeof meta === "object" && meta !== null && "TransactionResult" in meta
        ? (meta as { TransactionResult: string }).TransactionResult
        : "unknown";
    if (code !== "tesSUCCESS") throw new Error(`Payment failed: ${code}`);
    return signed.hash;
  } finally {
    await client.disconnect();
  }
}
