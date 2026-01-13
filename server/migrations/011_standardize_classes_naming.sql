-- Migration: Standardize Classes Table Columns
-- Renaming numeric_level -> order and level -> category for audit compliance

DO $$
BEGIN
    -- Rename numeric_level to order
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'numeric_level') THEN
        ALTER TABLE classes RENAME COLUMN numeric_level TO "order";
    END IF;

    -- Rename level to category
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'level') THEN
        ALTER TABLE classes RENAME COLUMN level TO category;
    END IF;
END $$;
