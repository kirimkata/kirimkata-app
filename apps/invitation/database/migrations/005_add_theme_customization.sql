-- Add custom_images JSONB column to invitation_contents table
-- Structure: { "background": "url", "background_limasan": "url", "pengantin": "url", "pengantin_jawa": "url" }
-- Note: theme_key already exists in invitation_contents table
ALTER TABLE invitation_contents 
ADD COLUMN IF NOT EXISTS custom_images JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN invitation_contents.custom_images IS 'JSON object storing custom image URLs for theme-specific customizations (template1: background, background_limasan, pengantin, pengantin_jawa)';
