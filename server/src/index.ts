// Main entry point for the Koa application
import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import router from './router';
import { ServerConfig } from './types/server';

const config: ServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  hostname: process.env.HOSTNAME || 'localhost',
};

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
    console.error('❌ Server error:', err);
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
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Use routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
const server = app.listen(config.port, config.hostname, () => {
  console.log(`🚀 Koa server running at http://${config.hostname}:${config.port}/`);
  console.log(`📊 Health check available at http://${config.hostname}:${config.port}/health`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - POST /v1/match - Run order matching`);
  console.log(`   - GET  /v1/orders - Get all orders`);
  console.log(`   - GET  /v1/transactions - Get all transactions`);
  console.log(`   - GET  /v1/results - Get matching results`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log('🛑 Server stopped');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
