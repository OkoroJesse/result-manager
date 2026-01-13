-- Migration: Add profile_picture_url to users table
-- Description: Adds a column to store the URL of the user's profile picture.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_picture_url') THEN 
        ALTER TABLE "users" ADD COLUMN "profile_picture_url" text; 
    END IF; 
END $$;

-- Optional: You might want to update the admin user with a default image for testing
-- UPDATE users SET profile_picture_url = 'https://images.unsplash.com/photo-1517423568366-eb5809ef70dd?w=150&h=150&fit=crop&crop=faces' WHERE id IN (SELECT id FROM users ORDER BY created_at LIMIT 1);
