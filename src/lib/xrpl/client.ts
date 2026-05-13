import { Client } from "xrpl";
import { resolveEndpoint } from "./network";

// In serverless / Next.js HMR a long-lived client gets its socket killed between
// invocations, surfacing as "websocket was closed". Connect-per-call is safer
// for our usage profile (one tx every few seconds at most).
let scriptClient: Client | null = null;

export async function getClient(): Promise<Client> {
  if (scriptClient && scriptClient.isConnected()) return scriptClient;
  const client = new Client(resolveEndpoint());
  await client.connect();
  if (process.env.FLOWBACK_LONG_LIVED_CLIENT === "1") scriptClient = client;
  return client;
}

export async function disconnect(): Promise<void> {
  if (scriptClient?.isConnected()) await scriptClient.disconnect();
  scriptClient = null;
}

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(resolveEndpoint());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect();
  }
}
