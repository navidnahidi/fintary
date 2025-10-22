// Order model - handles all database operations for orders
import { db } from './database';
import {
  OrderData,
  OrderInput,
  PaginatedOrdersResult,
  BulkInsertResult,
} from './types';

export class OrderModel {
  /**
   * Get paginated orders from database
   */
  async getOrders(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedOrdersResult> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM orders');
    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated orders
    const result = await db.query(
      `
      SELECT id, customer, order_id, order_date, item, price_cents 
      FROM orders 
      ORDER BY id
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    return {
      orders: result.rows as OrderData[],
      totalCount,
      totalPages,
    };
  }

  /**
   * Bulk insert orders into database
   */
  async bulkInsertOrders(orders: OrderInput[]): Promise<BulkInsertResult> {
    let insertedCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Check if order already exists
        const existingOrder = await db.query(
          'SELECT id FROM orders WHERE order_id = $1',
          [order.orderId]
        );

        if (existingOrder.rows.length > 0) {
          continue;
        }

        // Insert new order
        await db.query(
          `
          INSERT INTO orders (customer, order_id, order_date, item, price_cents)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            order.customer,
            order.orderId,
            order.date,
            order.item,
            order.priceCents,
          ]
        );

        insertedCount++;
      } catch (error) {
        const errorMsg = `Failed to insert order ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    return {
      insertedCount,
      totalProcessed: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get all orders (for matching purposes)
   */
  async getAllOrders(): Promise<OrderData[]> {
    const result = await db.query(`
      SELECT id, customer, order_id, order_date, item, price_cents 
      FROM orders 
      ORDER BY id
    `);

    return result.rows as OrderData[];
  }
}

export const orderModel = new OrderModel();
