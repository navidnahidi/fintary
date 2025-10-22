// Main entry point for the Koa application
import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import router from './router';
import { ServerConfig } from './types/server';
import { db } from './models/database';

const config: ServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  hostname: process.env.HOSTNAME || 'localhost',
};

// Initialize database extensions
async function initializeDatabase() {
  try {
    // Enable pg_trgm extension for fuzzy matching
    await db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    
    // Test connection
    await db.testConnection();
  } catch (error) {
    process.exit(1);
  }
}

// Create Koa application
const app = new Koa();

// Middleware
app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser());

// Error handling middleware
app.use(async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      message: err.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Request logging middleware
app.use(async (ctx: Koa.Context, next: Koa.Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Use routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start the server
    const server = app.listen(config.port, config.hostname, () => {
(`🚀 Koa server running at http://${config.hostname}:${config.port}/`);
(`📊 Health check available at http://${config.hostname}:${config.port}/health`);
(`🔗 API endpoints:`);
(`   - POST /v1/match - Run order matching`);
(`   - GET  /v1/orders - Get all orders`);
(`   - GET  /v1/transactions - Get all transactions`);
(`   - GET  /v1/results - Get matching results`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
(`${signal} received, shutting down gracefully`);
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    process.exit(1);
  }
}

// Start the server
startServer();
