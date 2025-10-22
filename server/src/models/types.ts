// Core business domain types for Order-Transaction Matcher

export interface Order {
  id?: number;
  customer: string;
  orderId: string;
  date: string;
  item: string;
  priceCents: number;
}

export interface Transaction {
  id?: number;
  customer: string;
  orderId: string;
  date: string;
  item: string;
  priceCents: number;
  txnType: string;
  txnAmountCents: number;
  matchedOrderId?: number;
}

export interface MatchedOrder {
  order: Order;
  txns: Transaction[];
  matchScore: number;
}

export interface MatchingResult {
  matched: MatchedOrder[];
  unmatchedOrders: Order[];
  unmatchedTransactions: Transaction[];
}

// Database model interfaces
export interface OrderData {
  id: number;
  customer: string;
  order_id: string;
  order_date: string;
  item: string;
  price_cents: number;
}

export interface OrderInput {
  customer: string;
  orderId: string;
  date: string;
  item: string;
  priceCents: number;
}

export interface PaginatedOrdersResult {
  orders: OrderData[];
  totalCount: number;
  totalPages: number;
}

export interface TransactionData {
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

export interface TransactionInput {
  customer: string;
  orderId: string;
  date: string;
  item: string;
  priceCents: number;
  txnType: string;
  txnAmountCents: number;
}

export interface BulkInsertResult {
  insertedCount: number;
  totalProcessed: number;
  errors?: string[];
}

// Re-export commonly used types for convenience
export type {
  DatabaseConfig,
  OrderRow,
  TransactionRow,
  OrderScoreRow,
} from '../types/database';
export type { ServerConfig, ApiResponse, ServerHealth } from '../types/server';
export type { MigrationFile, MigrationResult } from '../types/migration';
