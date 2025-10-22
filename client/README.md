# Fintary Client - React TypeScript App

A modern React application built with TypeScript and Vite for the Fintary Order-Transaction Matcher.

## 🚀 Features

- **React 18** with TypeScript support
- **Vite** for fast development and building
- **Modern UI** with beautiful gradients and animations
- **Type Safety** with TypeScript interfaces matching server types
- **Responsive Design** that works on all devices
- **Component Architecture** with reusable components

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # App header with logo
│   │   ├── Dashboard.tsx   # Main dashboard view
│   │   └── OrderMatcher.tsx # Detailed matching view
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared types matching server
│   ├── App.tsx            # Main app component
│   ├── App.css            # Modern styling
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── .eslintrc.cjs          # ESLint configuration
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎨 UI Components

### Header
- Modern logo with gradient styling
- Responsive design
- Clean typography

### Dashboard
- Statistics cards showing matching results
- Interactive "Run Matching" button
- Detailed order cards with transaction information
- Match score indicators

### Order Matcher
- Detailed algorithm information
- Unmatched orders and transactions display
- Feature cards explaining the matching process
- Comprehensive results view

## 🔗 Backend Integration

The app is configured to proxy API requests to the backend server:
- Frontend runs on `http://localhost:3001`
- Backend API calls are proxied to `http://localhost:3000`
- All `/api/*` requests are forwarded to the backend

## 🎯 TypeScript Features

- **Type Safety**: All components are fully typed
- **Interface Matching**: Types match the server-side interfaces exactly
- **Generic Components**: Reusable components with proper typing
- **API Response Types**: Typed API responses for better development experience

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3001` in your browser

## 🎨 Styling

- **Modern CSS**: Uses CSS Grid, Flexbox, and modern properties
- **Gradient Backgrounds**: Beautiful gradient backgrounds and cards
- **Responsive Design**: Mobile-first approach with breakpoints
- **Smooth Animations**: Hover effects and transitions
- **Glass Morphism**: Backdrop blur effects for modern look

The app is ready to connect to your backend server and display order-transaction matching results!
