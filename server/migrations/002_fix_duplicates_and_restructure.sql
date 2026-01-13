-- FIX FORWARD MIGRATION
-- This script handles the state where the previous migration partially ran or failed mid-way.

-- 1. Ensure 'level' column exists (if rename failed, this handles it)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'level' AND data_type = 'integer') THEN
        ALTER TABLE classes RENAME COLUMN level TO numeric_level;
    END IF;
END $$;

-- 2. Ensure new columns exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS level VARCHAR(10);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. FIX DUPLICATES: Manually update known clashes to ensure uniqueness
-- Case: Primary 1 and Primary 2 both owning numeric_level=1
UPDATE classes SET numeric_level = 1 WHERE name ILIKE '%Primary 1%';
UPDATE classes SET numeric_level = 2 WHERE name ILIKE '%Primary 2%';
UPDATE classes SET numeric_level = 3 WHERE name ILIKE '%Primary 3%';
UPDATE classes SET numeric_level = 4 WHERE name ILIKE '%Primary 4%';
UPDATE classes SET numeric_level = 5 WHERE name ILIKE '%Primary 5%';
UPDATE classes SET numeric_level = 6 WHERE name ILIKE '%Primary 6%';

UPDATE classes SET numeric_level = 7 WHERE name ILIKE '%JSS 1%';
UPDATE classes SET numeric_level = 8 WHERE name ILIKE '%JSS 2%';
UPDATE classes SET numeric_level = 9 WHERE name ILIKE '%JSS 3%';

UPDATE classes SET numeric_level = 10 WHERE name ILIKE '%SS 1%';
UPDATE classes SET numeric_level = 11 WHERE name ILIKE '%SS 2%';
UPDATE classes SET numeric_level = 12 WHERE name ILIKE '%SS 3%';

-- 4. Apply Constraint (safe attempt)
ALTER TABLE classes DROP CONSTRAINT IF EXISTS unique_numeric_level;
ALTER TABLE classes ADD CONSTRAINT unique_numeric_level UNIQUE (numeric_level);

-- 5. Backfill Categories based on corrected numeric_level
UPDATE classes SET level = 'PRI' WHERE numeric_level BETWEEN 1 AND 6;
UPDATE classes SET level = 'JSS' WHERE numeric_level BETWEEN 7 AND 9;
UPDATE classes SET level = 'SSS' WHERE numeric_level BETWEEN 10 AND 12;

-- 6. Insert Missing Default Classes
INSERT INTO classes (name, level, numeric_level, is_active) VALUES
('Primary 1', 'PRI', 1, true),
('Primary 2', 'PRI', 2, true),
('Primary 3', 'PRI', 3, true),
('Primary 4', 'PRI', 4, true),
('Primary 5', 'PRI', 5, true),
('Primary 6', 'PRI', 6, true),
('JSS 1', 'JSS', 7, true),
('JSS 2', 'JSS', 8, true),
('JSS 3', 'JSS', 9, true),
('SS 1', 'SSS', 10, true),
('SS 2', 'SSS', 11, true),
('SS 3', 'SSS', 12, true)
ON CONFLICT (numeric_level) DO NOTHING;
