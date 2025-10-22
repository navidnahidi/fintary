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
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new DatabaseConnection();
export default DatabaseConnection;
