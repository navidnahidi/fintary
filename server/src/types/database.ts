// Database-related type definitions

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Database row interfaces for raw query results
export interface OrderRow {
  id: number;
  customer: string;
  order_id: string;
  order_date: string;
  item: string;
  price_cents: number;
}

export interface TransactionRow {
  id: number;
  customer: string;
  order_id: string;
  transaction_date: string;
  item: string;
  price_cents: number;
  txn_type: string;
  txn_amount_cents: number;
  matched_order_id: number | null;
}

export interface OrderScoreRow {
  id: number;
  customer: string;
  order_id: string;
  order_date: string;
  item: string;
  price_cents: number;
  score: string; // PostgreSQL returns numeric as string
}

export interface MigrationRow {
  migration_name: string;
  executed_at: string;
  checksum: string;
  execution_time_ms: number;
}
