// Order-Transaction Matcher using PostgreSQL
import {
  Order,
  Transaction,
  MatchedOrder,
  MatchingResult,
  OrderRow,
  TransactionRow,
  OrderScoreRow,
} from '../models/types';
import { db } from '../models/database';

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

    console.log(
      `🔍 Starting PostgreSQL-only matching process with ${orders.length} orders and ${clientTransactions.length} transactions`
    );

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

    console.log(
      `📊 Found ${allMatches.length} potential matches above threshold`
    );

    // Greedily assign matches (highest scores first) - Allow multiple transactions per order
    const usedTransactions = new Set<string>();
    const orderMap = new Map<number, MatchedOrder>();

    for (const match of allMatches) {
      if (!usedTransactions.has(match.transaction.orderId)) {
        // Check if this order already has transactions
        if (orderMap.has(match.order.id!)) {
          // Add transaction to existing matched order
          orderMap.get(match.order.id!)!.txns.push(match.transaction);
          console.log(
            `✅ Added Transaction ${match.transaction.orderId} to existing Order ${match.order.orderId} (Score: ${(match.score * 100).toFixed(1)}%)`
          );
        } else {
          // Create new matched order entry
          const matchedOrder: MatchedOrder = {
            order: match.order,
            txns: [match.transaction],
            matchScore: match.score,
          };
          orderMap.set(match.order.id!, matchedOrder);
          console.log(
            `✅ Matched: Order ${match.order.orderId} with Transaction ${match.transaction.orderId} (Score: ${(match.score * 100).toFixed(1)}%)`
          );
        }
        usedTransactions.add(match.transaction.orderId);
      }
    }

    // Convert map to array
    matched.push(...orderMap.values());

    // Find unmatched orders and transactions
    const matchedOrderIds = new Set(matched.map(m => m.order.id!));
    const matchedTransactionIds = new Set();

    // Collect all matched transaction IDs
    for (const match of matched) {
      for (const txn of match.txns) {
        matchedTransactionIds.add(txn.orderId);
      }
    }

    unmatchedOrders.push(...orders.filter(o => !matchedOrderIds.has(o.id!)));
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
   * Main function to match orders with transactions using PostgreSQL
   */
  public async matchOrdersWithTransactions(): Promise<MatchingResult> {
    // First, test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Get all unmatched transactions
    const unmatchedTransactions = await this.getUnmatchedTransactions();

    const matched: MatchedOrder[] = [];

    // Process each unmatched transaction
    for (const transaction of unmatchedTransactions) {
      const bestMatch = await this.findBestOrderMatch(transaction);

      if (bestMatch && bestMatch.score > 0.2) {
        // More lenient threshold
        // Update transaction with matched order
        if (transaction.id && bestMatch.order.id) {
          await this.updateTransactionMatch(transaction.id, bestMatch.order.id);
        }

        // Add to matched results
        let existingMatch = matched.find(
          m => m.order.id === bestMatch.order.id
        );
        if (!existingMatch) {
          existingMatch = {
            order: bestMatch.order,
            txns: [],
            matchScore: bestMatch.score,
          };
          matched.push(existingMatch);
        }

        existingMatch.txns.push(transaction);
      }
    }

    // Get final unmatched data
    const finalUnmatchedOrders = await this.getUnmatchedOrders();
    const finalUnmatchedTransactions = await this.getUnmatchedTransactions();

    return {
      matched,
      unmatchedOrders: finalUnmatchedOrders,
      unmatchedTransactions: finalUnmatchedTransactions,
    };
  }

  /**
   * Find the best matching order for a transaction using PostgreSQL fuzzy matching
   */
  private async findBestOrderMatch(
    transaction: Transaction
  ): Promise<{ order: Order; score: number } | null> {
    const query = `
      WITH order_scores AS (
        SELECT 
          o.*,
          (
            -- Customer name similarity (weight: 0.4) - using advanced similarity
            advanced_string_similarity($1, o.customer) * 0.4 +
            -- Order ID similarity (weight: 0.3) - using advanced similarity
            advanced_string_similarity($2, o.order_id) * 0.3 +
            -- Item exact match (weight: 0.2)
            CASE WHEN LOWER($3) = LOWER(o.item) THEN 0.2 ELSE 0 END +
            -- Price match (weight: 0.1) - exact match for cents
            CASE WHEN ABS($4 - o.price_cents) = 0 THEN 0.1 ELSE 0.05 END +
            -- Date proximity bonus - more lenient
            CASE 
              WHEN $5::DATE >= o.order_date AND $5::DATE <= o.order_date + INTERVAL '60 days' THEN 0.1
              WHEN $5::DATE < o.order_date THEN -0.05
              ELSE 0
            END
          ) as score
        FROM orders o
        WHERE o.id NOT IN (
          SELECT DISTINCT matched_order_id 
          FROM transactions 
          WHERE matched_order_id IS NOT NULL
        )
      )
      SELECT *, score
      FROM order_scores
      WHERE score > 0.15
      ORDER BY score DESC
      LIMIT 1;
    `;

    const result = await db.query<OrderScoreRow>(query, [
      transaction.customer,
      transaction.orderId,
      transaction.item,
      transaction.priceCents,
      transaction.date,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      order: {
        id: row.id,
        customer: row.customer,
        orderId: row.order_id,
        date: row.order_date,
        item: row.item,
        priceCents: row.price_cents,
      },
      score: parseFloat(row.score),
    };
  }

  /**
   * Get all orders from database
   */
  private async getAllOrders(): Promise<Order[]> {
    const result = await db.query<OrderRow>('SELECT * FROM orders ORDER BY id');
    return result.rows.map((row: OrderRow) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));
  }

  /**
   * Get unmatched transactions from database
   */
  private async getUnmatchedTransactions(): Promise<Transaction[]> {
    const result = await db.query<TransactionRow>(`
      SELECT * FROM transactions 
      WHERE matched_order_id IS NULL 
      ORDER BY id
    `);

    return result.rows.map((row: TransactionRow) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.transaction_date,
      item: row.item,
      priceCents: row.price_cents,
      txnType: row.txn_type,
      txnAmountCents: row.txn_amount_cents,
      matchedOrderId: row.matched_order_id || undefined,
    }));
  }

  /**
   * Get unmatched orders from database
   */
  private async getUnmatchedOrders(): Promise<Order[]> {
    const result = await db.query<OrderRow>(`
      SELECT o.* FROM orders o
      LEFT JOIN transactions t ON o.id = t.matched_order_id
      WHERE t.matched_order_id IS NULL
      ORDER BY o.id
    `);

    return result.rows.map((row: OrderRow) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));
  }

  /**
   * Update transaction with matched order ID
   */
  private async updateTransactionMatch(
    transactionId: number,
    orderId: number
  ): Promise<void> {
    await db.query(
      'UPDATE transactions SET matched_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [orderId, transactionId]
    );
  }

  /**
   * Reset all matches (for testing)
   */
  public async resetMatches(): Promise<void> {
    await db.query(
      'UPDATE transactions SET matched_order_id = NULL, updated_at = CURRENT_TIMESTAMP'
    );
  }
}

// Example of how to use the matcher
export async function runOrderMatchingWithTransactions(
  clientTransactions: Transaction[]
): Promise<MatchingResult> {
  const matcher = new OrderTransactionMatcher();

  try {
    // Reset matches for fresh run
    await matcher.resetMatches();

    // Get all orders from database
    const ordersResult = await db.query(`
      SELECT id, customer, order_id, order_date, item, price_cents 
      FROM orders 
      ORDER BY id
    `);

    const orders: Order[] = ordersResult.rows.map(row => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));

    console.log(
      `📊 Matching ${orders.length} orders with ${clientTransactions.length} client transactions`
    );
    console.log(
      '📋 Available orders:',
      orders.map(o => `${o.customer} | ${o.orderId} | ${o.item}`)
    );
    console.log(
      '📋 Client transactions:',
      clientTransactions.map(t => `${t.customer} | ${t.orderId} | ${t.item}`)
    );

    // Run matching algorithm
    const result = await matcher.matchOrdersWithClientTransactions(
      orders,
      clientTransactions
    );

    console.log('\n=== CLIENT TRANSACTION MATCHING RESULTS ===\n');
    console.log(`✅ Matched Orders: ${result.matched.length}`);
    console.log(`❌ Unmatched Orders: ${result.unmatchedOrders.length}`);
    console.log(
      `❌ Unmatched Transactions: ${result.unmatchedTransactions.length}\n`
    );

    return result;
  } catch (error) {
    console.error('❌ Error in client transaction matching:', error);
    throw error;
  }
}

export async function runOrderMatching(): Promise<void> {
  const matcher = new OrderTransactionMatcher();

  try {
    // Reset matches for fresh run
    await matcher.resetMatches();

    // Run the matching
    const result = await matcher.matchOrdersWithTransactions();

    console.log('\n=== ORDER-TRANSACTION MATCHING RESULTS ===\n');

    console.log(`✅ Matched Orders: ${result.matched.length}`);
    console.log(`❌ Unmatched Orders: ${result.unmatchedOrders.length}`);
    console.log(
      `❌ Unmatched Transactions: ${result.unmatchedTransactions.length}\n\n`
    );

    if (result.matched.length > 0) {
      console.log('✅ MATCHED ORDERS:');
      console.log('==================================================');
      result.matched.forEach((match, index) => {
        console.log(
          `${index + 1}. ${match.order.customer} (${match.order.orderId}) - ${match.order.item} - $${(match.order.priceCents / 100).toFixed(2)}`
        );
        console.log(`   Match Score: ${match.matchScore.toFixed(3)}`);
        match.txns.forEach(txn => {
          console.log(
            `   - ${txn.customer} (${txn.orderId}) - ${txn.txnType}: $${(txn.txnAmountCents / 100).toFixed(2)}`
          );
        });
        console.log('');
      });
    }

    if (result.unmatchedOrders.length > 0) {
      console.log('❌ UNMATCHED ORDERS:');
      console.log('==================================================');
      result.unmatchedOrders.forEach((order, index) => {
        console.log(
          `${index + 1}. ${order.customer} (${order.orderId}) - ${order.item} - $${(order.priceCents / 100).toFixed(2)}`
        );
      });
      console.log('');
    }

    if (result.unmatchedTransactions.length > 0) {
      console.log('❌ UNMATCHED TRANSACTIONS:');
      console.log('==================================================');
      result.unmatchedTransactions.forEach((txn, index) => {
        console.log(
          `${index + 1}. ${txn.customer} (${txn.orderId}) - ${txn.txnType}: $${(txn.txnAmountCents / 100).toFixed(2)}`
        );
      });
      console.log('');
    }

    console.log('📊 SUMMARY:');
    console.log(
      `Total Orders: ${result.matched.length + result.unmatchedOrders.length}`
    );
    console.log(
      `Total Transactions: ${result.matched.reduce((sum, m) => sum + m.txns.length, 0) + result.unmatchedTransactions.length}`
    );
    console.log(`Successfully Matched: ${result.matched.length}`);

    const totalOrders = result.matched.length + result.unmatchedOrders.length;
    const totalTransactions =
      result.matched.reduce((sum, m) => sum + m.txns.length, 0) +
      result.unmatchedTransactions.length;
    const matchRate =
      totalOrders > 0
        ? (result.matched.length / Math.min(totalOrders, totalTransactions)) *
          100
        : 0;
    console.log(`Match Rate: ${matchRate.toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Error running order matching:', error);
  } finally {
    // Close database connection
    await db.close();
  }
}
