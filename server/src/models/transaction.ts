// Transaction model - handles all database operations for transactions
import { db } from './database';
import { TransactionData, TransactionInput, BulkInsertResult } from './types';

export class TransactionModel {
  /**
   * Get all transactions from database
   */
  async getTransactions(): Promise<TransactionData[]> {
    const result = await db.query(`
      SELECT id, customer, order_id, transaction_date, item, price_cents, 
             txn_type, txn_amount_cents, matched_order_id
      FROM transactions 
      ORDER BY id
    `);

    return result.rows as TransactionData[];
  }

  /**
   * Bulk insert transactions into database
   */
  async bulkInsertTransactions(
    transactions: TransactionInput[]
  ): Promise<BulkInsertResult> {
    let insertedCount = 0;
    const errors: string[] = [];

    for (const transaction of transactions) {
      try {
        // Check if transaction already exists
        const existingTransaction = await db.query(
          'SELECT id FROM transactions WHERE order_id = $1 AND customer = $2 AND txn_type = $3 AND txn_amount_cents = $4',
          [
            transaction.orderId,
            transaction.customer,
            transaction.txnType,
            transaction.txnAmountCents,
          ]
        );

        if (existingTransaction.rows.length > 0) {
          continue;
        }

        // Insert new transaction
        await db.query(
          `
          INSERT INTO transactions (customer, order_id, transaction_date, item, price_cents, txn_type, txn_amount_cents)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            transaction.customer,
            transaction.orderId,
            transaction.date,
            transaction.item,
            transaction.priceCents,
            transaction.txnType,
            transaction.txnAmountCents,
          ]
        );

        insertedCount++;
      } catch (error) {
        const errorMsg = `Failed to insert transaction ${transaction.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    return {
      insertedCount,
      totalProcessed: transactions.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get unmatched transactions from database
   */
  async getUnmatchedTransactions(): Promise<TransactionData[]> {
    const result = await db.query(`
      SELECT * FROM transactions 
      WHERE matched_order_id IS NULL 
      ORDER BY id
    `);

    return result.rows as TransactionData[];
  }

  /**
   * Update transaction with matched order ID
   */
  async updateTransactionMatch(
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
  async resetMatches(): Promise<void> {
    await db.query(
      'UPDATE transactions SET matched_order_id = NULL, updated_at = CURRENT_TIMESTAMP'
    );
  }
}

export const transactionModel = new TransactionModel();
