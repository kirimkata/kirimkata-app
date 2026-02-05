-- Migration: Sync Database Schema with API Code Expectations
-- Date: 2026-02-05

-- 1. Theme Settings (Add enable flags)
ALTER TABLE theme_settings
ADD COLUMN IF NOT EXISTS enable_gallery boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_love_story boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_wedding_gift boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_wishes boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_closing boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_css text;

-- 2. Gallery Settings (Simplify to single images array)
-- First, drop the old columns if they exist
ALTER TABLE gallery_settings 
DROP COLUMN IF EXISTS top_row_images,
DROP COLUMN IF EXISTS middle_images,
DROP COLUMN IF EXISTS bottom_grid_images;

-- Add the new single images column and is_enabled
ALTER TABLE gallery_settings
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- 3. Love Story (Rename columns & add enable flag)
-- Rename columns in love_story_blocks to match code expectations
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'love_story_blocks' AND column_name = 'block_title') THEN
    ALTER TABLE love_story_blocks RENAME COLUMN block_title TO title;
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'love_story_blocks' AND column_name = 'block_body') THEN
    ALTER TABLE love_story_blocks RENAME COLUMN block_body TO body_text;
  END IF;
END $$;

-- Add enable flag to settings
ALTER TABLE love_story_settings
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- 4. Wedding Gift (Add recipient details & enable flag)
ALTER TABLE wedding_gift_settings
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS recipient_phone text,
ADD COLUMN IF NOT EXISTS recipient_address_line1 text,
ADD COLUMN IF NOT EXISTS recipient_address_line2 text,
ADD COLUMN IF NOT EXISTS recipient_address_line3 text,
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- 5. Background Music (Update fields)
ALTER TABLE background_music_settings
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS register_as_background_audio boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- Rename loop_enabled to loop if it exists
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'background_music_settings' AND column_name = 'loop_enabled') THEN
    ALTER TABLE background_music_settings RENAME COLUMN loop_enabled TO loop;
  END IF;
END $$;

-- Drop legacy media_id column
ALTER TABLE background_music_settings
DROP COLUMN IF EXISTS media_id;

ALTER TABLE closing_settings
ADD COLUMN IF NOT EXISTS photo_alt text DEFAULT 'Closing Photo',
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS message_line3 text; -- Reverted from signature_text as requested

-- Drop obsolete fields if any (optional cleanup)
