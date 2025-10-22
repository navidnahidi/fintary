-- Seed Data: Sample orders and transactions for testing
-- Description: Insert sample data to test fuzzy matching functionality
-- Created: 2024-01-01

-- Check if this seed has already been run
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM migrations WHERE migration_name = '001_sample_data.sql') THEN
        RAISE NOTICE 'Seed 001_sample_data.sql has already been executed. Skipping...';
        RETURN;
    END IF;
END $$;

-- Clear existing data (for fresh seed)
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Reset sequences
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;

-- Insert sample orders (prices in cents)
INSERT INTO orders (customer, order_id, order_date, item, price_cents) VALUES
('Alex Abel', '18G', '2023-07-11', 'Tool A', 123),
('Brian Bell', '20S', '2023-08-08', 'Toy B', 321);

-- Insert sample transactions with various typos and inconsistencies (prices in cents)
INSERT INTO transactions (customer, order_id, transaction_date, item, price_cents, txn_type, txn_amount_cents) VALUES
-- Transactions for Alex Abel (with typos)
('Alexis Abe', '1B6', '2023-07-12', 'Tool A', 123, 'payment', 123),
('Alex Able', 'I8G', '2023-07-13', 'Tool A', 123, 'refund', -123),

-- Transactions for Brian Bell (with typos)
('Brian Ball', 'ZOS', '2023-08-11', 'Toy B', 321, 'payment-1', 121),
('Bryan', '705', '2023-08-13', 'Toy B', 321, 'payment-2', 200);

-- Additional test cases for better matching
INSERT INTO orders (customer, order_id, order_date, item, price_cents) VALUES
('John Smith', 'ABC123', '2023-09-01', 'Widget X', 550),
('Jane Doe', 'XYZ789', '2023-09-02', 'Gadget Y', 1299);

INSERT INTO transactions (customer, order_id, transaction_date, item, price_cents, txn_type, txn_amount_cents) VALUES
-- More challenging cases
('Jon Smith', 'ABC12', '2023-09-03', 'Widget X', 550, 'payment', 550),
('J. Doe', 'XYZ78', '2023-09-04', 'Gadget Y', 1299, 'payment', 1299),
('Johnny Smith', 'ABC123', '2023-09-05', 'Widget X', 550, 'refund', -550);

-- Record this seed as executed
INSERT INTO migrations (migration_name, checksum, execution_time_ms) 
VALUES ('001_sample_data.sql', 'seed123def456', 0)
ON CONFLICT (migration_name) DO NOTHING;
