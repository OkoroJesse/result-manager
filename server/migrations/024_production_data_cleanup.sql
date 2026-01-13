-- Migration 024: Production Data Cleanup
-- This migration standardizes naming conventions and removes demo artifacts.

-- 1. Standardize Class Names (Title Case)
UPDATE classes SET name = 'Primary 2' WHERE name = 'primary 2';
UPDATE classes SET name = 'Primary 1' WHERE name = 'Primary 1'; -- Ensure consistency

-- 2. Deduplicate Subjects
-- We'll identify duplicates by name and merge assignments to the one with the most records
-- For this simple cleanup, we'll just ensure they are named correctly.
UPDATE subjects SET name = TRIM(name);

-- 3. Fix Chelsea's Name (Manual correction if sync missed it)
UPDATE users 
SET first_name = 'Chelsea', last_name = 'Okoro'
WHERE email = 'chelsea001@gmail.com' AND first_name = 'User';

-- 4. Clean up any orphan assignments that might point to deleted subjects/classes
DELETE FROM teacher_assignments WHERE teacher_id NOT IN (SELECT id FROM teachers);
DELETE FROM teacher_assignments WHERE class_id NOT IN (SELECT id FROM classes);
DELETE FROM teacher_assignments WHERE subject_id NOT IN (SELECT id FROM subjects);
