// Results controller - handles business logic and data formatting for matching results
import { db } from '../models/database';

export class ResultsController {
  /**
   * Get matching results with proper formatting
   */
  async getResults() {
    // Get matched orders with their transactions
    const matchedResult = await db.query(`
      SELECT 
        o.id, o.customer, o.order_id, o.order_date, o.item, o.price_cents,
        t.id as txn_id, t.customer as txn_customer, t.order_id as txn_order_id,
        t.transaction_date, t.item as txn_item, t.price_cents as txn_price_cents,
        t.txn_type, t.txn_amount_cents
      FROM orders o
      INNER JOIN transactions t ON o.id = t.matched_order_id
      ORDER BY o.id, t.id
    `);

    // Get unmatched orders
    const unmatchedOrdersResult = await db.query(`
      SELECT o.* FROM orders o
      LEFT JOIN transactions t ON o.id = t.matched_order_id
      WHERE t.matched_order_id IS NULL
      ORDER BY o.id
    `);

    // Get unmatched transactions
    const unmatchedTransactionsResult = await db.query(`
      SELECT * FROM transactions 
      WHERE matched_order_id IS NULL 
      ORDER BY id
    `);

    // Process matched results
    const matchedMap = new Map();
    matchedResult.rows.forEach(row => {
      if (!matchedMap.has(row.id)) {
        matchedMap.set(row.id, {
          order: {
            id: row.id,
            customer: row.customer,
            orderId: row.order_id,
            date: row.order_date,
            item: row.item,
            priceCents: row.price_cents,
          },
          txns: [],
          matchScore: 0.95, // Default score for now
        });
      }

      matchedMap.get(row.id).txns.push({
        id: row.txn_id,
        customer: row.txn_customer,
        orderId: row.txn_order_id,
        date: row.transaction_date,
        item: row.txn_item,
        priceCents: row.txn_price_cents,
        txnType: row.txn_type,
        txnAmountCents: row.txn_amount_cents,
        matchedOrderId: row.id,
      });
    });

    const matched = Array.from(matchedMap.values());

    // Process unmatched orders
    const unmatchedOrders = unmatchedOrdersResult.rows.map(row => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));

    // Process unmatched transactions
    const unmatchedTransactions = unmatchedTransactionsResult.rows.map(row => ({
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
      data: {
        matched,
        unmatchedOrders,
        unmatchedTransactions,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const resultsController = new ResultsController();
