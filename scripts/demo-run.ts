// End-to-end demo. Amounts are tiny on purpose: each fresh testnet wallet only
// receives ~100 XRP, and Escrow + TrustSet owner reserves eat ~1.4 XRP, so the
// demo locks just enough to leave headroom.
import "dotenv/config";
import { Client, xrpToDrops } from "xrpl";
import { loadBuyerWallet, loadSellerWallet, getXrpBalance } from "../src/lib/xrpl/wallets";
import { createEscrow, finishEscrow } from "../src/lib/xrpl/escrow";
import { sendRlusd, getRlusdBalance } from "../src/lib/xrpl/token";
import { resolveEndpoint } from "../src/lib/xrpl/network";
import { explorerTxUrl } from "../src/lib/utils";

const ORDER_ID = 1001;

async function refundPayment(args: {
  signer: ReturnType<typeof loadSellerWallet>;
  to: string;
  amountXrp: string;
  destinationTag: number;
}): Promise<string> {
  const client = new Client(resolveEndpoint());
  await client.connect();
  try {
    const prepared = await client.autofill({
      TransactionType: "Payment",
      Account: args.signer.classicAddress,
      Destination: args.to,
      Amount: xrpToDrops(args.amountXrp),
      DestinationTag: args.destinationTag,
    });
    const signed = args.signer.sign(prepared);
    const res = await client.submitAndWait(signed.tx_blob);
    const meta = res.result.meta;
    const code =
      typeof meta === "object" && meta !== null && "TransactionResult" in meta
        ? (meta as { TransactionResult: string }).TransactionResult
        : "unknown";
    if (code !== "tesSUCCESS") throw new Error(`refund failed: ${code}`);
    return signed.hash;
  } finally {
    await client.disconnect();
  }
}

async function main() {
  const seller = loadSellerWallet();
  const buyer = loadBuyerWallet();

  console.log("FlowBack ‖ end-to-end demo");
  console.log(`  seller ${seller.classicAddress}`);
  console.log(`  buyer  ${buyer.classicAddress}\n`);

  const now = Math.floor(Date.now() / 1000);
  console.log("1) BUYER → EscrowCreate (10 XRP, DestinationTag=orderId)");
  const escrow = await createEscrow({
    sender: buyer,
    destination: seller.classicAddress,
    amountXrp: "10",
    destinationTag: ORDER_ID,
    finishAfterUnix: now + 3,
    cancelAfterUnix: now + 60 * 60,
  });
  console.log(`   sequence ${escrow.offerSequence}`);
  console.log(`   tx ${explorerTxUrl(escrow.txHash)}\n`);

  await new Promise((r) => setTimeout(r, 4500));

  console.log("2) SELLER → EscrowFinish (releases 10 XRP to seller)");
  const finishHash = await finishEscrow({
    signer: seller,
    owner: buyer.classicAddress,
    offerSequence: escrow.offerSequence,
  });
  console.log(`   tx ${explorerTxUrl(finishHash)}\n`);

  console.log("3) SELLER → Payment refund 3 XRP back to buyer (partial refund)");
  const refundHash = await refundPayment({
    signer: seller,
    to: buyer.classicAddress,
    amountXrp: "3",
    destinationTag: ORDER_ID,
  });
  console.log(`   tx ${explorerTxUrl(refundHash)}\n`);

  console.log("4) SELLER → RLUSD reward 1 to buyer");
  try {
    const rewardHash = await sendRlusd({
      sender: seller,
      destination: buyer.classicAddress,
      amount: "1",
      destinationTag: ORDER_ID,
    });
    console.log(`   tx ${explorerTxUrl(rewardHash)}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`   skipped (${msg})`);
    console.log(`   tip: receive RLUSD test tokens at https://tryrlusd.com → ${seller.classicAddress}\n`);
  }

  console.log("Final balances:");
  console.log(`  seller XRP   = ${await getXrpBalance(seller.classicAddress)}`);
  console.log(`  buyer  XRP   = ${await getXrpBalance(buyer.classicAddress)}`);
  console.log(`  seller RLUSD = ${(await getRlusdBalance(seller.classicAddress)).balance}`);
  console.log(`  buyer  RLUSD = ${(await getRlusdBalance(buyer.classicAddress)).balance}`);
}

main().catch((err) => {
  console.error("demo-run failed:", err);
  process.exit(1);
});
