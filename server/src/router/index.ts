// Main router configuration for Koa
import Router from '@koa/router';
import { Context } from 'koa';
import { runOrderMatchingWithTransactions } from '../controllers/orderMatcher';

const router = new Router();

// Health check endpoint
router.get('/health', async (ctx: Context) => {
  ctx.body = {
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
});

// Root endpoint
router.get('/', async (ctx: Context) => {
  ctx.body = {
    message: 'Welcome to Fintary Node.js API!',
    timestamp: new Date().toISOString(),
    features: ['TypeScript', 'Koa.js', 'PostgreSQL', 'Fuzzy Matching'],
    endpoints: {
      health: '/health',
      match: '/v1/match',
      orders: '/v1/orders',
      transactions: '/v1/transactions',
    },
  };
});


// Order matching with transactions endpoint
router.post('/v1/match/transactions', async (ctx: Context) => {
  try {
    console.log('🚀 Starting order matching with transactions...');

    const { transactions } = ctx.request.body as { transactions: any[] };
    
    if (!transactions || !Array.isArray(transactions)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid request: transactions array is required',
        timestamp: new Date().toISOString(),
      };
      return;
    }

    console.log(`📊 Processing ${transactions.length} transactions for matching`);

    // Run the actual matching algorithm
    const result = await runOrderMatchingWithTransactions(transactions);

    ctx.body = {
      success: true,
      data: result,
      message: 'Order matching with transactions completed successfully',
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Order matching with transactions completed successfully');
  } catch (error) {
    console.error('❌ Failed to run order matching with transactions:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error during order matching',
      timestamp: new Date().toISOString(),
    };
  }
});

// Get orders endpoint with pagination
router.get('/v1/orders', async (ctx: Context) => {
  try {
    const { db } = await import('../models/database');

    // Parse pagination parameters
    const page = parseInt(ctx.query.page as string) || 1;
    const limit = parseInt(ctx.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM orders');
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated orders
    const result = await db.query(`
      SELECT id, customer, order_id, order_date, item, price_cents 
      FROM orders 
      ORDER BY id
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const orders = result.rows.map(row => ({
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      date: row.order_date,
      item: row.item,
      priceCents: row.price_cents,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    ctx.body = {
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get transactions endpoint
router.get('/v1/transactions', async (ctx: Context) => {
  try {
    const { db } = await import('../models/database');

    const result = await db.query(`
      SELECT id, customer, order_id, transaction_date, item, price_cents, 
             txn_type, txn_amount_cents, matched_order_id 
      FROM transactions 
      ORDER BY id
    `);

    const transactions = result.rows.map(row => ({
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

    ctx.body = {
      success: true,
      data: transactions,
      count: transactions.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get matching results endpoint
router.get('/v1/results', async (ctx: Context) => {
  try {
    const { db } = await import('../models/database');

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

    ctx.body = {
      success: true,
      data: {
        matched,
        unmatchedOrders,
        unmatchedTransactions,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to fetch results:', error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to fetch results',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

export default router;
