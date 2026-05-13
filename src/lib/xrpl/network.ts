export type XrplNetwork = "testnet" | "devnet" | "mainnet";

const ENDPOINTS: Record<XrplNetwork, string> = {
  testnet: "wss://s.altnet.rippletest.net:51233",
  devnet: "wss://s.devnet.rippletest.net:51233",
  mainnet: "wss://xrplcluster.com",
};

export function resolveNetwork(): XrplNetwork {
  const raw = (process.env.XRPL_NETWORK ?? "testnet").toLowerCase();
  if (raw === "mainnet" || raw === "devnet" || raw === "testnet") return raw;
  return "testnet";
}

export function resolveEndpoint(network: XrplNetwork = resolveNetwork()): string {
  return ENDPOINTS[network];
}

export const RLUSD_ISSUER: Record<"testnet" | "mainnet", string> = {
  testnet: "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV",
  mainnet: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
};

export const RLUSD_CURRENCY_HEX = "524C555344000000000000000000000000000000";

export function resolveRlusdIssuer(): string {
  const network = resolveNetwork();
  const configured =
    process.env[`RLUSD_ISSUER_${network.toUpperCase()}`] ?? process.env.RLUSD_ISSUER;
  if (configured) return configured;
  if (network === "testnet" && process.env.SELLER_ADDRESS) return process.env.SELLER_ADDRESS;
  return network === "mainnet" ? RLUSD_ISSUER.mainnet : RLUSD_ISSUER.testnet;
}
