// Database connection and configuration
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseConfig } from '../types/database';

const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'fintary',
  user: process.env.DB_USER || 'fintary_user',
  password: process.env.DB_PASSWORD || 'fintary_password',
};

class DatabaseConnection {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = defaultConfig) {
    this.config = config;
    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', err => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute a query with parameters
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();
    try {
      const result = await client.query<T>(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Test the database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query<{ now: string }>('SELECT NOW()');
      console.log('✅ Database connected successfully:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Find orders with similar customer names using PostgreSQL similarity
   */
  async findSimilarOrders(
    customerName: string,
    threshold: number = 0.5
  ): Promise<
    Array<{
      id: number;
      customer: string;
      order_id: string;
      order_date: string;
      item: string;
      price_cents: number;
      similarity_score: number;
    }>
  > {
    const query = `
      SELECT 
        id, customer, order_id, order_date, item, price_cents,
        similarity(customer, $1) as similarity_score
      FROM orders 
      WHERE similarity(customer, $1) >= $2
      ORDER BY similarity_score DESC
    `;

    console.log(
      `🔍 PostgreSQL similarity query for "${customerName}" with threshold ${threshold}`
    );

    const result = await this.query(query, [customerName, threshold]);

    // Debug: Show all similarity scores (even below threshold)
    const debugQuery = `
      SELECT 
        customer,
        similarity(customer, $1) as similarity_score
      FROM orders 
      ORDER BY similarity_score DESC
    `;

    const debugResult = await this.query(debugQuery, [customerName]);
    console.log(`📊 All similarity scores for "${customerName}":`);
    debugResult.rows.forEach(row => {
      console.log(`   "${row.customer}" → ${row.similarity_score.toFixed(3)}`);
    });

    return result.rows as Array<{
      id: number;
      customer: string;
      order_id: string;
      order_date: string;
      item: string;
      price_cents: number;
      similarity_score: number;
    }>;
  }

  /**
   * Get paginated orders
   */
  async getOrders(page: number = 1, limit: number = 10): Promise<{
    orders: Array<{
      id: number;
      customer: string;
      order_id: string;
      order_date: string;
      item: string;
      price_cents: number;
    }>;
    totalCount: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await this.query('SELECT COUNT(*) as total FROM orders');
    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated orders
    const result = await this.query(
      `
      SELECT id, customer, order_id, order_date, item, price_cents 
      FROM orders 
      ORDER BY id
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    return {
      orders: result.rows as Array<{
        id: number;
        customer: string;
        order_id: string;
        order_date: string;
        item: string;
        price_cents: number;
      }>,
      totalCount,
      totalPages
    };
  }

  /**
   * Get all transactions
   */
  async getTransactions(): Promise<Array<{
    id: number;
    customer: string;
    order_id: string;
    transaction_date: string;
    item: string;
    price_cents: number;
    txn_type: string;
    txn_amount_cents: number;
    matched_order_id: number | null;
  }>> {
    const result = await this.query(`
      SELECT id, customer, order_id, transaction_date, item, price_cents, 
             txn_type, txn_amount_cents, matched_order_id
      FROM transactions 
      ORDER BY id
    `);
    
    return result.rows as Array<{
      id: number;
      customer: string;
      order_id: string;
      transaction_date: string;
      item: string;
      price_cents: number;
      txn_type: string;
      txn_amount_cents: number;
      matched_order_id: number | null;
    }>;
  }

  /**
   * Bulk insert orders
   */
  async bulkInsertOrders(orders: Array<{
    customer: string;
    orderId: string;
    date: string;
    item: string;
    priceCents: number;
  }>): Promise<{
    insertedCount: number;
    totalProcessed: number;
    errors?: string[];
  }> {
    let insertedCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Check if order already exists
        const existingOrder = await this.query(
          'SELECT id FROM orders WHERE order_id = $1',
          [order.orderId]
        );

        if (existingOrder.rows.length > 0) {
          console.log(`⚠️ Order ${order.orderId} already exists, skipping`);
          continue;
        }

        // Insert new order
        await this.query(`
          INSERT INTO orders (customer, order_id, order_date, item, price_cents)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          order.customer,
          order.orderId,
          order.date,
          order.item,
          order.priceCents
        ]);

        insertedCount++;
        console.log(`✅ Inserted order: ${order.orderId} for ${order.customer}`);
      } catch (error) {
        const errorMsg = `Failed to insert order ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return {
      insertedCount,
      totalProcessed: orders.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Bulk insert transactions
   */
  async bulkInsertTransactions(transactions: Array<{
    customer: string;
    orderId: string;
    date: string;
    item: string;
    priceCents: number;
    txnType: string;
    txnAmountCents: number;
  }>): Promise<{
    insertedCount: number;
    totalProcessed: number;
    errors?: string[];
  }> {
    let insertedCount = 0;
    const errors: string[] = [];

    for (const transaction of transactions) {
      try {
        // Check if transaction already exists
        const existingTransaction = await this.query(
          'SELECT id FROM transactions WHERE order_id = $1 AND customer = $2 AND txn_type = $3 AND txn_amount_cents = $4',
          [transaction.orderId, transaction.customer, transaction.txnType, transaction.txnAmountCents]
        );

        if (existingTransaction.rows.length > 0) {
          console.log(`⚠️ Transaction ${transaction.orderId} already exists, skipping`);
          continue;
        }

        // Insert new transaction
        await this.query(`
          INSERT INTO transactions (customer, order_id, transaction_date, item, price_cents, txn_type, txn_amount_cents)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          transaction.customer,
          transaction.orderId,
          transaction.date,
          transaction.item,
          transaction.priceCents,
          transaction.txnType,
          transaction.txnAmountCents
        ]);

        insertedCount++;
        console.log(`✅ Inserted transaction: ${transaction.orderId} for ${transaction.customer}`);
      } catch (error) {
        const errorMsg = `Failed to insert transaction ${transaction.orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return {
      insertedCount,
      totalProcessed: transactions.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new DatabaseConnection();
export default DatabaseConnection;
