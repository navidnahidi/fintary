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
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new DatabaseConnection();
export default DatabaseConnection;
