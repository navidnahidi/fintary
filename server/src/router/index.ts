// Router for handling API routes
import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

export class Router {
  private routes: Map<string, (req: IncomingMessage, res: ServerResponse, url: URL) => void> = new Map();

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check route
    this.routes.set('/health', this.handleHealthCheck.bind(this));
    
    // Root route
    this.routes.set('/', this.handleRoot.bind(this));
  }

  public handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const handler = this.routes.get(url.pathname);

    if (handler) {
      handler(req, res, url);
    } else {
      this.handleNotFound(res, url);
    }
  }

  private handleRoot(req: IncomingMessage, res: ServerResponse, url: URL): void {
    this.sendResponse(res, 200, {
      message: 'Welcome to Fintary Node.js App!',
      timestamp: new Date().toISOString(),
      features: ['TypeScript', 'ES6+', 'Nodemon'],
    });
  }

  private handleHealthCheck(req: IncomingMessage, res: ServerResponse, url: URL): void {
    this.sendResponse(res, 200, {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  }

  private handleNotFound(res: ServerResponse, url: URL): void {
    this.sendResponse(res, 404, {
      error: 'Not Found',
      path: url.pathname,
    });
  }

  private sendResponse(
    res: ServerResponse,
    statusCode: number,
    data: unknown
  ): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }
}
