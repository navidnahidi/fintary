-- Migration: 002_fix_string_similarity_functions.sql
-- Description: Replace custom functions with PostgreSQL extensions for better fuzzy matching
-- Created: 2024-01-01

-- Drop the problematic custom functions
DROP FUNCTION IF EXISTS levenshtein_distance(text, text);
DROP FUNCTION IF EXISTS string_similarity(text, text);
DROP FUNCTION IF EXISTS advanced_string_similarity(text, text);
DROP FUNCTION IF EXISTS simple_string_similarity(text, text);

-- Install PostgreSQL extensions for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;   -- Levenshtein distance and phonetic matching

-- Create a comprehensive fuzzy matching function using PostgreSQL extensions
CREATE OR REPLACE FUNCTION advanced_string_similarity(str1 TEXT, str2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
    trigram_similarity DECIMAL := 0;
    levenshtein_similarity DECIMAL := 0;
    phonetic_similarity DECIMAL := 0;
    metaphone_similarity DECIMAL := 0;
    dmetaphone_similarity DECIMAL := 0;
    max_len INTEGER;
    distance INTEGER;
BEGIN
    -- Handle edge cases
    IF str1 IS NULL OR str2 IS NULL THEN
        RETURN 0;
    END IF;
    
    str1 := LOWER(TRIM(str1));
    str2 := LOWER(TRIM(str2));
    
    -- If strings are identical, return perfect match
    IF str1 = str2 THEN
        RETURN 1.0;
    END IF;
    
    max_len := GREATEST(LENGTH(str1), LENGTH(str2));
    
    -- Strategy 1: Trigram similarity (pg_trgm)
    trigram_similarity := similarity(str1, str2);
    
    -- Strategy 2: Levenshtein distance (fuzzystrmatch)
    distance := levenshtein(str1, str2);
    levenshtein_similarity := CASE 
        WHEN max_len = 0 THEN 1.0
        ELSE GREATEST(0, (max_len - distance)::DECIMAL / max_len)
    END;
    
    -- Strategy 3: Soundex phonetic matching (fuzzystrmatch)
    IF soundex(str1) = soundex(str2) THEN
        phonetic_similarity := 0.8;
    END IF;
    
    -- Strategy 4: Metaphone phonetic matching (fuzzystrmatch)
    IF metaphone(str1, 4) = metaphone(str2, 4) THEN
        metaphone_similarity := 0.9;
    END IF;
    
    -- Strategy 5: Double Metaphone phonetic matching (fuzzystrmatch)
    IF dmetaphone(str1) = dmetaphone(str2) THEN
        dmetaphone_similarity := 0.95;
    END IF;
    
    -- Return the best similarity score
    RETURN GREATEST(
        trigram_similarity,
        levenshtein_similarity,
        phonetic_similarity,
        metaphone_similarity,
        dmetaphone_similarity
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Record this migration as executed
INSERT INTO migrations (migration_name, checksum, execution_time_ms) 
VALUES ('002_fix_string_similarity_functions.sql', 'fix123def456', 0)
ON CONFLICT (migration_name) DO NOTHING;
