// Order-Transaction Matcher using PostgreSQL
import { Order, Transaction, MatchedOrder, MatchingResult } from './types';
import { db } from './database';

export class OrderTransactionMatcher {
  constructor() {
    // No initialization needed - using database connection
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
    const unmatchedOrders: Order[] = await this.getAllOrders();

    // Process each unmatched transaction
    for (const transaction of unmatchedTransactions) {
      const bestMatch = await this.findBestOrderMatch(transaction);

      if (bestMatch && bestMatch.score > 0.2) { // More lenient threshold
        // Update transaction with matched order
        if (transaction.id && bestMatch.order.id) {
          await this.updateTransactionMatch(transaction.id, bestMatch.order.id);
        }
        
        // Add to matched results
        let existingMatch = matched.find(m => m.order.id === bestMatch.order.id);
        if (!existingMatch) {
          existingMatch = {
            order: bestMatch.order,
            txns: [],
            matchScore: bestMatch.score
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
      unmatchedTransactions: finalUnmatchedTransactions
    };
  }

  /**
   * Find the best matching order for a transaction using PostgreSQL fuzzy matching
   */
  private async findBestOrderMatch(transaction: Transaction): Promise<{ order: Order; score: number } | null> {
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

    const result = await db.query(query, [
      transaction.customer,
      transaction.orderId,
      transaction.item,
      transaction.priceCents,
      transaction.date
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
        priceCents: parseInt(row.price_cents)
      },
      score: parseFloat(row.score)
    };
  }

  /**
   * Get all orders from database
   */
  private async getAllOrders(): Promise<Order[]> {
    const result = await db.query('SELECT * FROM orders ORDER BY id');
    return result.rows.map((row: any) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: parseInt(row.price_cents)
    }));
  }

  /**
   * Get unmatched transactions from database
   */
  private async getUnmatchedTransactions(): Promise<Transaction[]> {
    const result = await db.query(`
      SELECT * FROM transactions 
      WHERE matched_order_id IS NULL 
      ORDER BY id
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.transaction_date,
      item: row.item,
      priceCents: parseInt(row.price_cents),
      txnType: row.txn_type,
      txnAmountCents: parseInt(row.txn_amount_cents)
    }));
  }

  /**
   * Get unmatched orders from database
   */
  private async getUnmatchedOrders(): Promise<Order[]> {
    const result = await db.query(`
      SELECT o.* FROM orders o
      LEFT JOIN transactions t ON o.id = t.matched_order_id
      WHERE t.matched_order_id IS NULL
      ORDER BY o.id
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: parseInt(row.price_cents)
    }));
  }

  /**
   * Update transaction with matched order ID
   */
  private async updateTransactionMatch(transactionId: number, orderId: number): Promise<void> {
    await db.query(
      'UPDATE transactions SET matched_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [orderId, transactionId]
    );
  }

  /**
   * Insert sample data into database
   */
  public async insertSampleData(): Promise<void> {
    // Insert orders (prices in cents)
    await db.query(`
      INSERT INTO orders (customer, order_id, order_date, item, price_cents) VALUES
      ('Alex Abel', '18G', '2023-07-11', 'Tool A', 123),
      ('Brian Bell', '20S', '2023-08-08', 'Toy B', 321)
      ON CONFLICT (order_id) DO NOTHING
    `);

    // Insert transactions (prices in cents)
    await db.query(`
      INSERT INTO transactions (customer, order_id, transaction_date, item, price_cents, txn_type, txn_amount_cents) VALUES
      ('Alexis Abe', '1B6', '2023-07-12', 'Tool A', 123, 'payment', 123),
      ('Alex Able', 'I8G', '2023-07-13', 'Tool A', 123, 'refund', -123),
      ('Brian Ball', 'ZOS', '2023-08-11', 'Toy B', 321, 'payment-1', 121),
      ('Bryan', '705', '2023-08-13', 'Toy B', 321, 'payment-2', 200)
      ON CONFLICT DO NOTHING
    `);
  }

  /**
   * Reset all matches (for testing)
   */
  public async resetMatches(): Promise<void> {
    await db.query('UPDATE transactions SET matched_order_id = NULL, updated_at = CURRENT_TIMESTAMP');
  }
}

// Example of how to use the matcher
export async function runOrderMatching(): Promise<void> {
  const matcher = new OrderTransactionMatcher();
  
  try {
    // Insert sample data if needed
    await matcher.insertSampleData();
    
    // Reset matches for fresh run
    await matcher.resetMatches();
    
    // Run the matching
    const result = await matcher.matchOrdersWithTransactions();
    
    console.log('\n=== ORDER-TRANSACTION MATCHING RESULTS ===\n');
    
    console.log(`✅ Matched Orders: ${result.matched.length}`);
    console.log(`❌ Unmatched Orders: ${result.unmatchedOrders.length}`);
    console.log(`❌ Unmatched Transactions: ${result.unmatchedTransactions.length}\n\n`);
    
    if (result.matched.length > 0) {
      console.log('✅ MATCHED ORDERS:');
      console.log('==================================================');
      result.matched.forEach((match, index) => {
        console.log(`${index + 1}. ${match.order.customer} (${match.order.orderId}) - ${match.order.item} - $${(match.order.priceCents / 100).toFixed(2)}`);
        console.log(`   Match Score: ${match.matchScore.toFixed(3)}`);
        match.txns.forEach(txn => {
          console.log(`   - ${txn.customer} (${txn.orderId}) - ${txn.txnType}: $${(txn.txnAmountCents / 100).toFixed(2)}`);
        });
        console.log('');
      });
    }
    
    if (result.unmatchedOrders.length > 0) {
      console.log('❌ UNMATCHED ORDERS:');
      console.log('==================================================');
      result.unmatchedOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.customer} (${order.orderId}) - ${order.item} - $${(order.priceCents / 100).toFixed(2)}`);
      });
      console.log('');
    }
    
    if (result.unmatchedTransactions.length > 0) {
      console.log('❌ UNMATCHED TRANSACTIONS:');
      console.log('==================================================');
      result.unmatchedTransactions.forEach((txn, index) => {
        console.log(`${index + 1}. ${txn.customer} (${txn.orderId}) - ${txn.txnType}: $${(txn.txnAmountCents / 100).toFixed(2)}`);
      });
      console.log('');
    }
    
    console.log('📊 SUMMARY:');
    console.log(`Total Orders: ${result.matched.length + result.unmatchedOrders.length}`);
    console.log(`Total Transactions: ${result.matched.reduce((sum, m) => sum + m.txns.length, 0) + result.unmatchedTransactions.length}`);
    console.log(`Successfully Matched: ${result.matched.length}`);
    
    const totalOrders = result.matched.length + result.unmatchedOrders.length;
    const totalTransactions = result.matched.reduce((sum, m) => sum + m.txns.length, 0) + result.unmatchedTransactions.length;
    const matchRate = totalOrders > 0 ? (result.matched.length / Math.min(totalOrders, totalTransactions)) * 100 : 0;
    console.log(`Match Rate: ${matchRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error running order matching:', error);
  } finally {
    // Close database connection
    await db.close();
  }
}