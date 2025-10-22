// Type definitions for Order-Transaction Matcher

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
