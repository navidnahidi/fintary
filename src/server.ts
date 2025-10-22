import Koa, { Context } from 'koa';
import Router from 'koa-router';
import cors from 'koa-cors';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors());
app.use(bodyParser());

// Serve static files from the public directory
app.use(serve(path.join(__dirname, '../dist/public')));

// API routes
router.get('/api/health', async (ctx: Context) => {
  ctx.body = { status: 'OK', message: 'Server is running!' };
});

router.get('/api/users', async (ctx: Context) => {
  ctx.body = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];
});

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

// Catch-all handler for React Router
app.use(async (ctx: Context) => {
  if (ctx.path.startsWith('/api/')) {
    ctx.status = 404;
    ctx.body = { error: 'API endpoint not found' };
  } else {
    // Serve React app for all other routes
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fintary</title>
        </head>
        <body>
          <div id="root"></div>
          <script src="/bundle.js"></script>
        </body>
      </html>
    `;
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});