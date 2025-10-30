-- Migration: 001_create_orders_and_transactions_tables.sql
-- Description: Create orders and transactions tables with indexes and functions
-- Created: 2024-01-01

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    price_cents INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    price_cents INTEGER NOT NULL,
    txn_type VARCHAR(50) NOT NULL,
    txn_amount_cents INTEGER NOT NULL,
    matched_order_id INTEGER REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Install PostgreSQL extensions for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;   -- Levenshtein distance and phonetic matching

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_item ON orders(item);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_matched ON transactions(matched_order_id);

-- Removed simple_string_similarity: not used by application

-- Removed advanced_string_similarity: not used by application

-- Record this migration as executed
INSERT INTO migrations (migration_name, checksum, execution_time_ms) 
VALUES ('001_create_orders_and_transactions_tables.sql', 'abc123def456', 0)
ON CONFLICT (migration_name) DO NOTHING;
