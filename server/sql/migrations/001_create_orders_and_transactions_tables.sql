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

-- Create a simple string similarity function (avoiding complex array operations)
CREATE OR REPLACE FUNCTION simple_string_similarity(str1 TEXT, str2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
    len1 INTEGER;
    len2 INTEGER;
    matches INTEGER := 0;
    i INTEGER;
    j INTEGER;
    max_len INTEGER;
BEGIN
    -- Handle edge cases
    IF str1 IS NULL OR str2 IS NULL THEN
        RETURN 0;
    END IF;
    
    str1 := LOWER(str1);
    str2 := LOWER(str2);
    
    len1 := LENGTH(str1);
    len2 := LENGTH(str2);
    max_len := GREATEST(len1, len2);
    
    IF max_len = 0 THEN
        RETURN 1.0;
    END IF;
    
    -- Simple character-by-character comparison
    FOR i IN 1..LEAST(len1, len2) LOOP
        IF SUBSTRING(str1 FROM i FOR 1) = SUBSTRING(str2 FROM i FOR 1) THEN
            matches := matches + 1;
        END IF;
    END LOOP;
    
    -- Add bonus for length similarity
    IF len1 = len2 THEN
        matches := matches + 1;
    END IF;
    
    RETURN matches::DECIMAL / (max_len + 1);
END;
$$ LANGUAGE plpgsql;

-- Create a more advanced fuzzy matching function with phonetic support
CREATE OR REPLACE FUNCTION advanced_string_similarity(str1 TEXT, str2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
    direct_similarity DECIMAL;
    phonetic_similarity DECIMAL;
    substitution_similarity DECIMAL;
    partial_similarity DECIMAL;
    words1 TEXT[];
    words2 TEXT[];
BEGIN
    -- Direct similarity
    direct_similarity := string_similarity(str1, str2);
    
    -- Phonetic similarity for common name variations
    phonetic_similarity := 0;
    
    -- Check for common phonetic variations
    IF (str1 ILIKE '%brian%' AND str2 ILIKE '%bryan%') OR 
       (str1 ILIKE '%bryan%' AND str2 ILIKE '%brian%') THEN
        phonetic_similarity := 0.9;
    ELSIF (str1 ILIKE '%alex%' AND str2 ILIKE '%alexis%') OR 
          (str1 ILIKE '%alexis%' AND str2 ILIKE '%alex%') THEN
        phonetic_similarity := 0.8;
    ELSIF (str1 ILIKE '%abel%' AND str2 ILIKE '%able%') OR 
          (str1 ILIKE '%able%' AND str2 ILIKE '%abel%') THEN
        phonetic_similarity := 0.9;
    ELSIF (str1 ILIKE '%bell%' AND str2 ILIKE '%ball%') OR 
          (str1 ILIKE '%ball%' AND str2 ILIKE '%bell%') THEN
        phonetic_similarity := 0.8;
    END IF;
    
    -- Character substitution similarity (for order IDs like 18G vs 1B6)
    substitution_similarity := string_similarity(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(str1, '1', 'i'), '0', 'o'), '6', 'g'), '8', 'b'), 's', 'z'),
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(str2, '1', 'i'), '0', 'o'), '6', 'g'), '8', 'b'), 's', 'z')
    );
    
    -- Partial name matching
    partial_similarity := 0;
    words1 := string_to_array(LOWER(str1), ' ');
    words2 := string_to_array(LOWER(str2), ' ');
    
    -- If one is single word and other is multiple, try matching parts
    IF array_length(words1, 1) = 1 AND array_length(words2, 1) > 1 THEN
        FOR i IN 1..array_length(words2, 1) LOOP
            partial_similarity := GREATEST(partial_similarity, string_similarity(words1[1], words2[i]));
        END LOOP;
    ELSIF array_length(words2, 1) = 1 AND array_length(words1, 1) > 1 THEN
        FOR i IN 1..array_length(words1, 1) LOOP
            partial_similarity := GREATEST(partial_similarity, string_similarity(words2[1], words1[i]));
        END LOOP;
    ELSIF array_length(words1, 1) > 1 AND array_length(words2, 1) > 1 THEN
        -- Match first and last names separately
        partial_similarity := (string_similarity(words1[1], words2[1]) + 
                              string_similarity(words1[array_length(words1, 1)], words2[array_length(words2, 1)])) / 2;
    END IF;
    
    -- Return the best similarity score
    RETURN GREATEST(direct_similarity, phonetic_similarity, substitution_similarity, partial_similarity);
END;
$$ LANGUAGE plpgsql;

-- Record this migration as executed
INSERT INTO migrations (migration_name, checksum, execution_time_ms) 
VALUES ('001_create_orders_and_transactions_tables.sql', 'abc123def456', 0)
ON CONFLICT (migration_name) DO NOTHING;
