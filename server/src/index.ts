// Main entry point for the application
import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { Router } from './router';

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
  private router: Router;

  constructor(config: ServerConfig) {
    this.config = config;
    this.router = new Router();
    this.server = createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
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

    // Delegate routing to the router
    this.router.handleRequest(req, res);
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
