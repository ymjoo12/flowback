// Open RLUSD Trust Lines for both demo wallets. Requires SELLER_SEED/BUYER_SEED in .env.
import "dotenv/config";
import type { Wallet } from "xrpl";
import { loadBuyerWallet, loadSellerWallet, getXrpBalance } from "../src/lib/xrpl/wallets";
import { ensureRlusdTrustline } from "../src/lib/xrpl/token";
import { explorerTxUrl } from "../src/lib/utils";

async function open(label: string, wallet: Wallet) {
  const xrp = await getXrpBalance(wallet.classicAddress);
  console.log(`  → opening RLUSD Trust Line for ${label} (XRP balance: ${xrp})`);
  const hash = await ensureRlusdTrustline({ account: wallet });
  console.log(`    tx ${hash}`);
  console.log(`    explorer ${explorerTxUrl(hash, "testnet")}`);
}

async function main() {
  console.log("FlowBack ‖ RLUSD Trust Line bootstrap\n");
  await open("SELLER", loadSellerWallet());
  console.log();
  await open("BUYER", loadBuyerWallet());
  console.log();
  console.log("Both wallets can now hold RLUSD on the configured network.");
}

main().catch((err) => {
  console.error("setup-rlusd-trustline failed:", err);
  process.exit(1);
});
