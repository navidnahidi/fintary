// Main entry point for the application
import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { URL } from 'url';

interface ServerConfig {
  port: number;
  hostname: string;
}

const config: ServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  hostname: process.env.HOSTNAME || 'localhost',
};

// Example ES6+ features demonstration
class Application {
  private server: Server;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    switch (url.pathname) {
      case '/':
        this.sendResponse(res, 200, {
          message: 'Welcome to Fintary Node.js App!',
          timestamp: new Date().toISOString(),
          features: ['TypeScript', 'ES6+', 'Nodemon'],
        });
        break;

      case '/health':
        this.sendResponse(res, 200, {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        });
        break;

      default:
        this.sendResponse(res, 404, {
          error: 'Not Found',
          path: url.pathname,
        });
    }
  }

  private sendResponse(
    res: ServerResponse,
    statusCode: number,
    data: unknown
  ): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  public start(): void {
    this.server.listen(this.config.port, this.config.hostname, () => {
      console.log(
        `🚀 Server running at http://${this.config.hostname}:${this.config.port}/`
      );
      console.log(
        `📊 Health check available at http://${this.config.hostname}:${this.config.port}/health`
      );
    });
  }

  public stop(): void {
    this.server.close(() => {
      console.log('🛑 Server stopped');
    });
  }
}

// Start the application
const app = new Application(config);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  app.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  app.stop();
  process.exit(0);
});

app.start();
