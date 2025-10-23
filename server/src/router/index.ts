// Main router configuration for Koa
import Router from '@koa/router';
import { Context } from 'koa';
import { runOrderMatchingWithTransactions } from '../controllers/orderMatcher';
import { ordersController } from '../controllers/orders';
import { transactionsController } from '../controllers/transactions';
import { Transaction, OrderInput, TransactionInput } from '../models/types';

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
    const { transactions } = ctx.request.body as {
      transactions: Transaction[];
    };

    if (!transactions || !Array.isArray(transactions)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid request: transactions array is required',
        timestamp: new Date().toISOString(),
      };
      return;
    }

    // Run the actual matching algorithm
    const result = await runOrderMatchingWithTransactions(transactions);

    ctx.body = {
      success: true,
      data: result,
      message: 'Order matching with transactions completed successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error during order matching',
      timestamp: new Date().toISOString(),
    };
  }
});

// Bulk insert orders endpoint
router.post('/v1/orders/bulk', async (ctx: Context) => {
  try {
    const { orders } = ctx.request.body as { orders: OrderInput[] };

    // Use controller to handle business logic and formatting
    const result = await ordersController.bulkInsertOrders(orders);

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error during bulk insert',
      timestamp: new Date().toISOString(),
    };
  }
});

// Bulk insert transactions endpoint
router.post('/v1/transactions/bulk', async (ctx: Context) => {
  try {
    const { transactions } = ctx.request.body as {
      transactions: TransactionInput[];
    };

    // Use controller to handle business logic and formatting
    const result =
      await transactionsController.bulkInsertTransactions(transactions);

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error during bulk insert',
      timestamp: new Date().toISOString(),
    };
  }
});

// Get orders endpoint with pagination
router.get('/v1/orders', async (ctx: Context) => {
  try {
    // Parse pagination parameters
    const page = parseInt(ctx.query.page as string) || 1;
    const limit = parseInt(ctx.query.limit as string) || 10;

    // Use controller to handle business logic and formatting
    const result = await ordersController.getOrders(page, limit);

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Update order endpoint
router.put('/v1/orders/:id', async (ctx: Context) => {
  try {
    const orderId = parseInt(ctx.params.id);
    const orderData = ctx.request.body as Partial<OrderInput>;

    if (isNaN(orderId)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid order ID',
        timestamp: new Date().toISOString(),
      };
      return;
    }

    const result = await ordersController.updateOrder(orderId, orderData);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Delete order endpoint
router.delete('/v1/orders/:id', async (ctx: Context) => {
  try {
    const orderId = parseInt(ctx.params.id);

    if (isNaN(orderId)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Invalid order ID',
        timestamp: new Date().toISOString(),
      };
      return;
    }

    const result = await ordersController.deleteOrder(orderId);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Get transactions endpoint
router.get('/v1/transactions', async (ctx: Context) => {
  try {
    // Use controller to handle business logic and formatting
    const result = await transactionsController.getTransactions();

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
  }
});

export default router;
