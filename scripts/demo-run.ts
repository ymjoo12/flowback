import "dotenv/config";
import { createOrder, executePartialRefund, payReward, type OrderDetail } from "../src/lib/orders";
import { getRlusdBalance } from "../src/lib/xrpl/token";
import { getXrpBalance, loadBuyerWallet, loadSellerWallet } from "../src/lib/xrpl/wallets";
import { explorerTxUrl } from "../src/lib/utils";

const ORDER_XRP = "2";
const KEEP_XRP = "1.25";
const REFUND_XRP = "0.75";
const REWARD_RLUSD = "0.25";

function tx(detail: OrderDetail, kind: string): string {
  const settlement = detail.settlements.find((item) => item.kind === kind);
  if (!settlement) throw new Error(`missing ${kind} settlement`);
  return explorerTxUrl(settlement.tx_hash);
}

async function main() {
  const seller = loadSellerWallet();
  const buyer = loadBuyerWallet();

  console.log("FlowBack end-to-end validation");
  console.log(`  seller ${seller.classicAddress}`);
  console.log(`  buyer  ${buyer.classicAddress}\n`);

  console.log(`1) Create order and lock ${ORDER_XRP} XRP in Escrow`);
  const created = await createOrder({
    totalXrp: ORDER_XRP,
    note: "Order settlement validation",
  });
  console.log(`   order #${created.order.id}`);
  console.log(`   tx ${tx(created, "escrow_create")}\n`);

  console.log(`2) Finish Escrow and refund ${REFUND_XRP} XRP`);
  const refunded = await executePartialRefund({
    orderId: created.order.id,
    keepXrp: KEEP_XRP,
    refundXrp: REFUND_XRP,
    note: "Partial refund",
  });
  console.log(`   finish ${tx(refunded, "escrow_finish")}`);
  console.log(`   refund ${tx(refunded, "refund")}\n`);

  console.log(`3) Pay ${REWARD_RLUSD} RLUSD reward`);
  const rewarded = await payReward({
    orderId: created.order.id,
    amountRlusd: REWARD_RLUSD,
    note: "Post-purchase credit",
  });
  console.log(`   reward ${tx(rewarded, "reward")}\n`);

  console.log("Final balances");
  console.log(`  seller XRP   = ${await getXrpBalance(seller.classicAddress)}`);
  console.log(`  buyer  XRP   = ${await getXrpBalance(buyer.classicAddress)}`);
  console.log(`  seller RLUSD = ${(await getRlusdBalance(seller.classicAddress)).balance}`);
  console.log(`  buyer  RLUSD = ${(await getRlusdBalance(buyer.classicAddress)).balance}`);
}

main().catch((err) => {
  console.error("demo-run failed:", err);
  process.exit(1);
});
