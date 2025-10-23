// Order-Transaction Matcher using PostgreSQL
import {
  Order,
  Transaction,
  MatchedOrder,
  MatchingResult,
} from '../models/types';
import { db } from '../models/database';
import { orderModel } from '../models/order';
import { transactionModel } from '../models/transaction';

export class OrderTransactionMatcher {
  constructor() {
    // No initialization needed - using database connection
  }

  /**
   * Match orders with client-provided transactions - POSTGRESQL ONLY
   */
  public async matchOrdersWithClientTransactions(
    orders: Order[],
    clientTransactions: Transaction[]
  ): Promise<MatchingResult> {
    const matched: MatchedOrder[] = [];
    const unmatchedOrders: Order[] = [];
    const unmatchedTransactions: Transaction[] = [];

    // Use PostgreSQL similarity function for all matching
    const allMatches: {
      order: Order;
      transaction: Transaction;
      score: number;
    }[] = [];

    for (const transaction of clientTransactions) {
      // Use database model to find similar orders
      const similarOrders = await db.findSimilarOrders(
        transaction.customer,
        0.5
      );

      for (const row of similarOrders) {
        const order: Order = {
          id: row.id,
          customer: row.customer,
          orderId: row.order_id,
          date: row.order_date,
          item: row.item,
          priceCents: row.price_cents,
        };

        allMatches.push({
          order,
          transaction,
          score: row.similarity_score,
        });
      }
    }

    // Sort by score (highest first)
    allMatches.sort((a, b) => b.score - a.score);

    // Greedily assign matches (highest scores first) - Allow multiple transactions per order
    const usedTransactions = new Set<string>();
    const orderMap = new Map<number, MatchedOrder>();

    for (const match of allMatches) {
      if (!usedTransactions.has(match.transaction.orderId)) {
        // Check if this order already has transactions
        if (match.order.id && orderMap.has(match.order.id)) {
          // Add transaction to existing matched order
          const existingMatch = orderMap.get(match.order.id);
          if (existingMatch) {
            existingMatch.txns.push(match.transaction);
          }
        } else if (match.order.id) {
          // Create new matched order entry
          const matchedOrder: MatchedOrder = {
            order: match.order,
            txns: [match.transaction],
            matchScore: match.score,
          };
          orderMap.set(match.order.id, matchedOrder);
        }
        usedTransactions.add(match.transaction.orderId);
      }
    }

    // Convert map to array
    matched.push(...orderMap.values());

    // Find unmatched orders and transactions
    const matchedOrderIds = new Set(matched.map(m => m.order.id).filter((id): id is number => id !== undefined));
    const matchedTransactionIds = new Set();

    // Collect all matched transaction IDs
    for (const match of matched) {
      for (const txn of match.txns) {
        matchedTransactionIds.add(txn.orderId);
      }
    }

    unmatchedOrders.push(...orders.filter(o => o.id && !matchedOrderIds.has(o.id)));
    unmatchedTransactions.push(
      ...clientTransactions.filter(t => !matchedTransactionIds.has(t.orderId))
    );

    return {
      matched,
      unmatchedOrders,
      unmatchedTransactions,
    };
  }

  /**
   * Reset all matches (for testing)
   */
  public async resetMatches(): Promise<void> {
    await transactionModel.resetMatches();
  }
}

// Example of how to use the matcher
export async function runOrderMatchingWithTransactions(
  clientTransactions: Transaction[]
): Promise<MatchingResult> {
  const matcher = new OrderTransactionMatcher();

  // Reset matches for fresh run
  await matcher.resetMatches();

  // Get all orders from database
  const orderData = await orderModel.getAllOrders();
  const orders: Order[] = orderData.map(row => ({
    id: row.id,
    customer: row.customer,
    orderId: row.order_id,
    date: row.order_date,
    item: row.item,
    priceCents: row.price_cents,
  }));

  // Run matching algorithm
  const result = await matcher.matchOrdersWithClientTransactions(
    orders,
    clientTransactions
  );

  return result;
}
