import "dotenv/config";
import { fundFromFaucet } from "../src/lib/xrpl/wallets";
import { explorerAccountUrl } from "../src/lib/utils";

async function fundFresh(label: string) {
  process.stdout.write(`  → funding ${label} from testnet faucet... `);
  const { wallet, xrpBalance } = await fundFromFaucet();
  console.log(`OK (balance: ${xrpBalance} XRP)`);
  console.log(`    address: ${wallet.classicAddress}`);
  console.log(`    seed:    ${wallet.seed}`);
  console.log(`    explorer ${explorerAccountUrl(wallet.classicAddress, "testnet")}`);
  return wallet;
}

async function main() {
  console.log("FlowBack ‖ Testnet wallet bootstrap\n");
  const seller = await fundFresh("SELLER");
  console.log();
  const buyer = await fundFresh("BUYER");
  console.log();
  console.log("Done. Copy these into .env (file is gitignored):\n");
  console.log(`SELLER_SEED=${seller.seed}`);
  console.log(`SELLER_ADDRESS=${seller.classicAddress}`);
  console.log(`BUYER_SEED=${buyer.seed}`);
  console.log(`BUYER_ADDRESS=${buyer.classicAddress}`);
}

main().catch((err) => {
  console.error("setup-wallets failed:", err);
  process.exit(1);
});
