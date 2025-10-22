// Transactions controller - handles business logic and data formatting
import { db } from '../models/database';

export class TransactionsController {
  /**
   * Get all transactions with proper formatting
   */
  async getTransactions() {
    const transactions = await db.getTransactions();
    
    // Format transactions for API response
    const formattedTransactions = transactions.map(row => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.transaction_date,
      item: row.item,
      priceCents: row.price_cents,
      txnType: row.txn_type,
      txnAmountCents: row.txn_amount_cents,
      matchedOrderId: row.matched_order_id,
    }));

    return {
      success: true,
      data: formattedTransactions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Bulk insert transactions with proper validation and formatting
   */
  async bulkInsertTransactions(transactions: any[]) {
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Invalid request: transactions array is required');
    }

    console.log(`📊 Bulk inserting ${transactions.length} transactions`);
    
    const result = await db.bulkInsertTransactions(transactions);

    return {
      success: true,
      data: {
        insertedCount: result.insertedCount,
        totalProcessed: result.totalProcessed,
        errors: result.errors,
      },
      message: `Successfully inserted ${result.insertedCount} out of ${result.totalProcessed} transactions`,
      timestamp: new Date().toISOString(),
    };
  }
}

export const transactionsController = new TransactionsController();
