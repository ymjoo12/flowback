import { loadBuyerWallet, loadSellerWallet } from "./xrpl/wallets";
import { createEscrow, finishEscrow } from "./xrpl/escrow";
import { sendRlusd } from "./xrpl/token";
import { Client, xrpToDrops } from "xrpl";
import { resolveEndpoint } from "./xrpl/network";
import { queries, type OrderRow, type SettlementRow } from "./db";

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
  const seller = loadSellerWallet();
  const buyer = loadBuyerWallet();

  const now = Math.floor(Date.now() / 1000);
  // FinishAfter must be future at submission, else ledger returns tecNO_PERMISSION.
  const result = await createEscrow({
    sender: buyer,
    destination: seller.classicAddress,
    amountXrp: input.totalXrp,
    finishAfterUnix: now + 3,
    cancelAfterUnix: now + 60 * 60,
  });

  const insert = queries.insertOrder({
    buyer_address: buyer.classicAddress,
    seller_address: seller.classicAddress,
    total_xrp: input.totalXrp,
    status: "escrowed",
    escrow_owner: buyer.classicAddress,
    escrow_sequence: result.offerSequence,
    escrow_tx_hash: result.txHash,
  });
  const orderId = Number(insert.lastInsertRowid);
  queries.insertSettlement({
    order_id: orderId,
    kind: "escrow_create",
    amount: input.totalXrp,
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

// XRPL Escrow cannot be partially finished; we EscrowFinish in full then
// immediately Payment the unused portion back to the buyer.
export async function executePartialRefund(input: PartialRefundInput): Promise<OrderDetail> {
  const order = queries.getOrder(input.orderId);
  if (!order) throw new Error(`order ${input.orderId} not found`);
  if (order.status !== "escrowed") {
    throw new Error(`order ${input.orderId} is in '${order.status}', cannot refund`);
  }
  if (typeof order.escrow_sequence !== "number") {
    throw new Error(`order ${input.orderId} has no escrow_sequence`);
  }

  const seller = loadSellerWallet();
  // Wait past FinishAfter (createOrder set it to now+3s).
  await sleep(4500);
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

  if (Number(input.refundXrp) > 0) {
    const refundHash = await sendXrpPayment({
      from: seller,
      to: order.buyer_address,
      amountXrp: input.refundXrp,
      destinationTag: order.id,
    });
    queries.insertSettlement({
      order_id: order.id,
      kind: "refund",
      amount: input.refundXrp,
      currency: "XRP",
      tx_hash: refundHash,
      note: input.note ?? "Partial refund (post-finish)",
    });
    queries.updateOrderStatus(order.id, "partially_refunded");
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
  if (!order) throw new Error(`order ${input.orderId} not found`);

  const seller = loadSellerWallet();
  const hash = await sendRlusd({
    sender: seller,
    destination: order.buyer_address,
    amount: input.amountRlusd,
    destinationTag: order.id,
  });
  queries.insertSettlement({
    order_id: order.id,
    kind: "reward",
    amount: input.amountRlusd,
    currency: "RLUSD",
    tx_hash: hash,
    note: input.note ?? "Loyalty reward",
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
