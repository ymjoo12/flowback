import { Client } from "xrpl";
import { resolveEndpoint } from "./network";

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
