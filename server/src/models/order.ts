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

  /**
   * Get unmatched orders from database
   */
  async getUnmatchedOrders(): Promise<OrderData[]> {
    const result = await db.query(`
      SELECT o.* FROM orders o
      LEFT JOIN transactions t ON o.id = t.matched_order_id
      WHERE t.matched_order_id IS NULL
      ORDER BY o.id
    `);

    return result.rows as OrderData[];
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    orderId: number,
    orderData: Partial<OrderInput>
  ): Promise<OrderData> {
    // Build dynamic update query based on provided fields
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (orderData.customer !== undefined) {
      updateFields.push(`customer = $${paramIndex++}`);
      values.push(orderData.customer);
    }
    if (orderData.orderId !== undefined) {
      updateFields.push(`order_id = $${paramIndex++}`);
      values.push(orderData.orderId);
    }
    if (orderData.date !== undefined) {
      updateFields.push(`order_date = $${paramIndex++}`);
      values.push(orderData.date);
    }
    if (orderData.item !== undefined) {
      updateFields.push(`item = $${paramIndex++}`);
      values.push(orderData.item);
    }
    if (orderData.priceCents !== undefined) {
      updateFields.push(`price_cents = $${paramIndex++}`);
      values.push(orderData.priceCents);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add orderId as the last parameter
    values.push(orderId);

    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, customer, order_id, order_date, item, price_cents
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    return result.rows[0] as OrderData;
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [orderId]
    );

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    return true;
  }
}

export const orderModel = new OrderModel();
