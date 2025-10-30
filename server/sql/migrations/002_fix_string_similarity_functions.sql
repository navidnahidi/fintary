-- Migration: 002_fix_string_similarity_functions.sql
-- Description: Replace custom functions with PostgreSQL extensions for better fuzzy matching
-- Created: 2024-01-01

-- Install PostgreSQL extensions for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;   -- Levenshtein distance and phonetic matching

-- Record this migration as executed
INSERT INTO migrations (migration_name, checksum, execution_time_ms) 
VALUES ('002_fix_string_similarity_functions.sql', 'fix123def456', 0)
ON CONFLICT (migration_name) DO NOTHING;
