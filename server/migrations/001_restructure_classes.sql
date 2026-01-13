-- Rename 'level' to 'numeric_level' to store the sorting order (1-12)
ALTER TABLE classes RENAME COLUMN level TO numeric_level;

-- Add new 'level' column for categories (PRI, JSS, SSS)
ALTER TABLE classes ADD COLUMN level VARCHAR(10);

-- Add 'is_active' status
ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add constraint for uniqueness of sorting order
ALTER TABLE classes ADD CONSTRAINT unique_numeric_level UNIQUE (numeric_level);

-- Backfill Categories based on numeric_level assumption (if data existed)
-- Note: If previous 'level' was 1-12, this works.
UPDATE classes SET level = 'PRI' WHERE numeric_level BETWEEN 1 AND 6;
UPDATE classes SET level = 'JSS' WHERE numeric_level BETWEEN 7 AND 9;
UPDATE classes SET level = 'SSS' WHERE numeric_level BETWEEN 10 AND 12;

-- If table was empty or incomplete, Insert Default Classes
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
