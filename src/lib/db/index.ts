import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let _db: Database.Database | null = null;

function dbPath(): string {
  const p = process.env.FLOWBACK_DB_PATH ?? resolve(process.cwd(), "data/flowback.db");
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(dbPath());
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA);
  return _db;
}

export interface OrderRow {
  id: number;
  buyer_address: string;
  seller_address: string;
  total_xrp: string;
  status: OrderStatus;
  escrow_owner: string;
  escrow_sequence: number | null;
  escrow_tx_hash: string | null;
  created_at: string;
}

export type OrderStatus =
  | "escrowed"
  | "partially_refunded"
  | "completed"
  | "fully_refunded";

export interface SettlementRow {
  id: number;
  order_id: number;
  kind: SettlementKind;
  amount: string;
  currency: "XRP" | "RLUSD";
  tx_hash: string;
  note: string | null;
  created_at: string;
}

export type SettlementKind = "escrow_create" | "escrow_finish" | "refund" | "reward";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_address   TEXT    NOT NULL,
  seller_address  TEXT    NOT NULL,
  total_xrp       TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'escrowed',
  escrow_owner    TEXT    NOT NULL,
  escrow_sequence INTEGER,
  escrow_tx_hash  TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settlements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL,
  amount      TEXT    NOT NULL,
  currency    TEXT    NOT NULL,
  tx_hash     TEXT    NOT NULL,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_settlements_order ON settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_address);
`;

export const queries = {
  insertOrder: (row: Omit<OrderRow, "id" | "created_at">) =>
    getDb()
      .prepare(
        `INSERT INTO orders
         (buyer_address, seller_address, total_xrp, status, escrow_owner, escrow_sequence, escrow_tx_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        row.buyer_address,
        row.seller_address,
        row.total_xrp,
        row.status,
        row.escrow_owner,
        row.escrow_sequence,
        row.escrow_tx_hash,
      ),
  updateOrderStatus: (id: number, status: OrderStatus) =>
    getDb().prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id),
  getOrder: (id: number) =>
    getDb().prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as OrderRow | undefined,
  listOrders: () =>
    getDb().prepare(`SELECT * FROM orders ORDER BY id DESC`).all() as OrderRow[],
  listOrdersByBuyer: (addr: string) =>
    getDb()
      .prepare(`SELECT * FROM orders WHERE buyer_address = ? ORDER BY id DESC`)
      .all(addr) as OrderRow[],
  listOrdersBySeller: (addr: string) =>
    getDb()
      .prepare(`SELECT * FROM orders WHERE seller_address = ? ORDER BY id DESC`)
      .all(addr) as OrderRow[],
  insertSettlement: (row: Omit<SettlementRow, "id" | "created_at">) =>
    getDb()
      .prepare(
        `INSERT INTO settlements (order_id, kind, amount, currency, tx_hash, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(row.order_id, row.kind, row.amount, row.currency, row.tx_hash, row.note),
  listSettlements: (orderId: number) =>
    getDb()
      .prepare(`SELECT * FROM settlements WHERE order_id = ? ORDER BY id ASC`)
      .all(orderId) as SettlementRow[],
};
