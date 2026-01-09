-- Add theme_key column to invitation_contents table
-- This allows each client to have their own theme configuration

ALTER TABLE invitation_contents
ADD COLUMN IF NOT EXISTS theme_key TEXT DEFAULT 'parallax/parallax-custom1';

-- Add comment to explain the column
COMMENT ON COLUMN invitation_contents.theme_key IS 'Theme identifier for the invitation (e.g., parallax/parallax-custom1, parallax/parallax-template1, premium/simple1)';
