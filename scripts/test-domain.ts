import assert from "node:assert/strict";
import {
  assertBalancedRefund,
  parseNonNegativeAmount,
  parsePositiveAmount,
} from "../src/lib/amounts";
import { AppError } from "../src/lib/errors";
import { RLUSD_ISSUER, resolveRlusdIssuer } from "../src/lib/xrpl/network";

function expectAppError(fn: () => void, status: number, messagePart: string): void {
  assert.throws(
    fn,
    (err) =>
      err instanceof AppError &&
      err.status === status &&
      err.message.includes(messagePart),
  );
}

function testAmounts(): void {
  assert.deepEqual(parsePositiveAmount("1.234567", "totalXrp", 100), {
    value: 1.234567,
    text: "1.234567",
  });
  assert.deepEqual(parseNonNegativeAmount("0", "refundXrp", 100), {
    value: 0,
    text: "0",
  });

  expectAppError(() => parsePositiveAmount("0", "totalXrp", 100), 400, "greater than 0");
  expectAppError(() => parsePositiveAmount("1.2345678", "totalXrp", 100), 400, "6 decimal");
  expectAppError(() => parsePositiveAmount("-1", "totalXrp", 100), 400, "between 0 and 100");
  expectAppError(() => parsePositiveAmount("101", "totalXrp", 100), 400, "between 0 and 100");

  assert.doesNotThrow(() => assertBalancedRefund(10, 7, 3));
  assert.doesNotThrow(() => assertBalancedRefund(10, 10, 0));
  assert.doesNotThrow(() => assertBalancedRefund(10, 0, 10));
  expectAppError(() => assertBalancedRefund(10, 8, 3), 400, "must equal");
  expectAppError(() => assertBalancedRefund(10, 0, 11), 400, "cannot exceed");
}

function testRlusdIssuerResolution(): void {
  const original = {
    XRPL_NETWORK: process.env.XRPL_NETWORK,
    SELLER_ADDRESS: process.env.SELLER_ADDRESS,
    RLUSD_ISSUER: process.env.RLUSD_ISSUER,
    RLUSD_ISSUER_TESTNET: process.env.RLUSD_ISSUER_TESTNET,
    RLUSD_ISSUER_MAINNET: process.env.RLUSD_ISSUER_MAINNET,
  };
  try {
    delete process.env.SELLER_ADDRESS;
    delete process.env.RLUSD_ISSUER;
    delete process.env.RLUSD_ISSUER_TESTNET;
    delete process.env.RLUSD_ISSUER_MAINNET;

    process.env.XRPL_NETWORK = "testnet";
    assert.equal(resolveRlusdIssuer(), RLUSD_ISSUER.testnet);

    process.env.SELLER_ADDRESS = "rMSJe2Poj2ZYVz4Q4rUqKNAdDVegBNiD3W";
    assert.equal(resolveRlusdIssuer(), process.env.SELLER_ADDRESS);

    process.env.RLUSD_ISSUER_TESTNET = "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH";
    assert.equal(resolveRlusdIssuer(), process.env.RLUSD_ISSUER_TESTNET);

    process.env.XRPL_NETWORK = "mainnet";
    assert.equal(resolveRlusdIssuer(), RLUSD_ISSUER.mainnet);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (typeof value === "string") process.env[key] = value;
      else delete process.env[key];
    }
  }
}

testAmounts();
testRlusdIssuerResolution();
console.log("Domain tests passed");
