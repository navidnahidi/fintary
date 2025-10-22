# Fintary - Order-Transaction Matcher

A Node.js application with TypeScript support that matches orders with transactions using PostgreSQL and fuzzy string matching.

## Features

- **PostgreSQL Integration**: Uses Docker for easy database setup
- **Fuzzy String Matching**: Built-in Levenshtein distance algorithm in PostgreSQL
- **TypeScript Support**: Full type safety and modern ES6+ features
- **Docker Setup**: One-command database setup with Docker Compose

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start PostgreSQL Database
```bash
npm run db:up
```

### 3. Run Order Matching
```bash
npm run match
```

## Available Commands

### Development
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled application

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

### Database Management
- `npm run db:up` - Start PostgreSQL container
- `npm run db:down` - Stop PostgreSQL container
- `npm run db:logs` - View database logs
- `npm run db:reset` - Reset database (removes all data)

### Migration System
- `npm run migrate:migrate` - Run pending migrations
- `npm run migrate:seed` - Run pending seeds
- `npm run migrate:status` - Check migration status
- `npm run migrate:fresh` - Reset + migrate + seed
- `npm run migrate:reset` - Drop all tables
- `npm run migrate` - Show help

### Order Matching
- `npm run match` - Run the order-transaction matcher

## Migration System

The application includes a comprehensive migration system to track database schema changes and seed data.

### Migration Files Structure
```
sql/
├── migrations/
│   └── 001_create_orders_and_transactions_tables.sql
└── seeds/
    └── 001_sample_data.sql
```

### Migration Tracking
- All migrations and seeds are tracked in the `migrations` table
- Prevents duplicate execution of the same migration/seed
- Tracks execution time and checksums for integrity
- Supports both schema changes (migrations) and data seeding

### Usage Examples

#### Fresh Setup
```bash
# Start database
npm run db:up

# Run all migrations and seeds
npm run migrate:fresh
```

#### Check Status
```bash
npm run migrate:status
```

#### Run Only Migrations
```bash
npm run migrate:migrate
```

#### Run Only Seeds
```bash
npm run migrate:seed
```

## Database Schema

The application uses PostgreSQL with the following tables:

### Orders Table
- `id` - Primary key
- `customer` - Customer name
- `order_id` - Unique order identifier
- `order_date` - Date of the order
- `item` - Item name
- `price_cents` - Order price in cents (integer)

### Transactions Table
- `id` - Primary key
- `customer` - Customer name
- `order_id` - Transaction order ID
- `transaction_date` - Date of transaction
- `item` - Item name
- `price_cents` - Transaction price in cents (integer)
- `txn_type` - Transaction type (payment, refund, etc.)
- `txn_amount_cents` - Transaction amount in cents (integer)
- `matched_order_id` - Reference to matched order (nullable)

### Migrations Table
- `id` - Primary key
- `migration_name` - Name of the migration/seed file
- `executed_at` - Timestamp when executed
- `checksum` - File checksum for integrity
- `execution_time_ms` - Execution time in milliseconds

## Fuzzy Matching Algorithm

The matcher uses PostgreSQL extensions for robust fuzzy matching:

### PostgreSQL Extensions Used
- **pg_trgm**: Trigram similarity for character-level matching
- **fuzzystrmatch**: Levenshtein distance and phonetic matching algorithms

### Matching Strategies
1. **Trigram Similarity** - Character-level fuzzy matching
2. **Levenshtein Distance** - Edit distance calculation
3. **Soundex Phonetic Matching** - Handles pronunciation variations
4. **Metaphone Phonetic Matching** - Advanced phonetic algorithms
5. **Double Metaphone** - Enhanced phonetic matching

### Weight Distribution
1. **Customer Name Matching** (40% weight)
2. **Order ID Matching** (30% weight)
3. **Item Exact Match** (20% weight)
4. **Price Matching** (10% weight)
5. **Date Proximity Bonus** - Transactions within 30 days of order

## Sample Data

The application includes sample data that demonstrates fuzzy matching:

- **Orders**: Alex Abel (18G), Brian Bell (20S)
- **Transactions**: Various transactions with typos and inconsistencies
- **Expected Matches**: Handles "Alex Abel" ↔ "Alexis Abe", "Brian Bell" ↔ "Bryan", etc.

## Environment Variables

You can customize the database connection:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fintary
DB_USER=fintary_user
DB_PASSWORD=fintary_password
```

## Docker Configuration

The `docker-compose.yml` file sets up:
- PostgreSQL 15 container
- Automatic schema initialization
- Persistent data volume
- Port mapping (5432:5432)

## Code Quality Tools

The project includes ESLint and Prettier for maintaining code quality:

### ESLint Configuration
- TypeScript support with `@typescript-eslint`
- Prettier integration to avoid conflicts
- Custom rules for Node.js and TypeScript best practices
- Automatic fixing for many issues

### Prettier Configuration
- Single quotes for strings
- Semicolons enabled
- 2-space indentation
- 80 character line width
- Trailing commas in ES5

### Usage
```bash
# Check code quality
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format all code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
src/
├── types.ts          # TypeScript interfaces
├── database.ts       # Database connection and queries
├── orderMatcher.ts   # Main matching logic
├── runMatcher.ts     # CLI runner
├── migrate.ts        # Migration runner
└── index.ts          # HTTP server

sql/
├── migrations/
│   ├── 001_create_orders_and_transactions_tables.sql
│   └── 002_fix_string_similarity_functions.sql
└── seeds/
    └── 001_sample_data.sql

# Configuration files
.prettierrc           # Prettier configuration
.eslintrc.js          # ESLint configuration
.prettierignore       # Prettier ignore patterns
.eslintignore         # ESLint ignore patterns
docker-compose.yml    # PostgreSQL container setup
```

## Troubleshooting

### Database Connection Issues
1. Ensure Docker is running
2. Check if PostgreSQL container is up: `npm run db:logs`
3. Verify port 5432 is not in use by another service

### TypeScript Compilation Issues
1. Run `npm run build` to check for errors
2. Ensure all dependencies are installed: `npm install`

### Matching Issues
1. Check database connection: `npm run db:logs`
2. Reset database and try again: `npm run db:reset`
3. Verify sample data is loaded correctly
