-- Migration: Upgrade Teachers Table
-- Adding phone and gender info for production readiness

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender VARCHAR CHECK (gender IN ('male', 'female', 'other'));

-- Update updated_at trigger if not already handled
-- (Assuming standard trigger exists or handled by app)
