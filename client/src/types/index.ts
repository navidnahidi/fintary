// Type definitions matching the server-side types
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

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ServerHealth {
  status: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}
