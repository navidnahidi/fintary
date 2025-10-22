# Fintary

A modern full-stack application built with Node.js, Koa, React, and TypeScript.

## Features

- **Backend**: Koa.js server with TypeScript
- **Frontend**: React with TypeScript
- **Build System**: Webpack for client-side bundling
- **Development**: Hot reloading and development server
- **API**: RESTful API endpoints
- **Testing**: Jest with React Testing Library

## Project Structure

```
fintary/
├── src/
│   ├── server.ts          # Koa server
│   ├── utils.ts           # Utility functions
│   ├── setupTests.ts      # Jest setup
│   ├── __tests__/         # Test files
│   └── client/
│       ├── index.html     # HTML template
│       ├── index.tsx      # React entry point
│       └── App.tsx        # Main React component
├── dist/                  # Build output
├── package.json
├── tsconfig.json
├── jest.config.js
└── webpack.config.js
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

1. **Start the backend server** (in one terminal):
```bash
npm run dev
```

2. **Start the frontend development server** (in another terminal):
```bash
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

1. **Build the client**:
```bash
npm run build:client
```

2. **Build the server**:
```bash
npm run build
```

3. **Start the production server**:
```bash
npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - Get users list

## Testing

The project includes comprehensive testing setup with Jest and React Testing Library:

- **Unit Tests**: Test utility functions and components
- **Integration Tests**: Test API endpoints and React components
- **Coverage Reports**: Generate test coverage reports

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:client` - Start frontend development server
- `npm run build` - Build TypeScript
- `npm run build:client` - Build React app
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Technologies Used

- **Backend**: Node.js, Koa.js, TypeScript
- **Frontend**: React, TypeScript
- **Testing**: Jest, React Testing Library, ts-jest
- **Build Tools**: Webpack, ts-loader
- **Development**: nodemon, webpack-dev-server
