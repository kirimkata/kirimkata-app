-- Migration: 010_create_wedding_registrations.sql
-- Description: Create wedding_registrations table as source of truth for wedding data
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: wedding_registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Event Type & Metadata
  event_type VARCHAR(50) NOT NULL DEFAULT 'islam', 
  -- Options: 'islam', 'kristen', 'katolik', 'hindu', 'buddha', 'custom'
  wedding_date DATE NOT NULL,
  timezone VARCHAR(10) DEFAULT 'WIB',
  
  -- Bride Info
  bride_name VARCHAR(100) NOT NULL,
  bride_full_name VARCHAR(255) NOT NULL,
  bride_father_name VARCHAR(255),
  bride_mother_name VARCHAR(255),
  bride_instagram VARCHAR(100),
  
  -- Groom Info
  groom_name VARCHAR(100) NOT NULL,
  groom_full_name VARCHAR(255) NOT NULL,
  groom_father_name VARCHAR(255),
  groom_mother_name VARCHAR(255),
  groom_instagram VARCHAR(100),
  
  -- Event 1 (Akad/Holy Matrimony)
  event1_title VARCHAR(100) DEFAULT 'Akad Nikah',
  event1_date DATE NOT NULL,
  event1_start_time TIME NOT NULL,
  event1_end_time TIME,
  event1_venue_name VARCHAR(255),
  event1_venue_address TEXT,
  event1_venue_city VARCHAR(100),
  event1_venue_province VARCHAR(100),
  event1_maps_url TEXT,
  
  -- Event 2 (Resepsi)
  event2_title VARCHAR(100) DEFAULT 'Resepsi',
  event2_date DATE,
  event2_start_time TIME,
  event2_end_time TIME,
  event2_venue_name VARCHAR(255),
  event2_venue_address TEXT,
  event2_venue_city VARCHAR(100),
  event2_venue_province VARCHAR(100),
  event2_maps_url TEXT,
  
  -- Streaming (if applicable)
  streaming_enabled BOOLEAN DEFAULT false,
  streaming_url TEXT,
  streaming_description TEXT,
  streaming_button_label VARCHAR(100) DEFAULT 'Watch Live',
  
  -- Physical Gift Address
  gift_recipient_name VARCHAR(255),
  gift_recipient_phone VARCHAR(20),
  gift_address_line1 TEXT,
  gift_address_line2 TEXT,
  gift_address_city VARCHAR(100),
  gift_address_province VARCHAR(100),
  gift_address_postal_code VARCHAR(10),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_slug 
  ON wedding_registrations(slug);

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_client_id 
  ON wedding_registrations(client_id);

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_wedding_date 
  ON wedding_registrations(wedding_date);

-- ============================================================================
-- CREATE TRIGGER: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wedding_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wedding_registrations_updated_at
  BEFORE UPDATE ON wedding_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_registrations_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wedding_registrations IS 'Source of truth for wedding registration data. Each row represents one wedding invitation.';
COMMENT ON COLUMN wedding_registrations.slug IS 'Unique URL identifier for the invitation (e.g., "siti-budi")';
COMMENT ON COLUMN wedding_registrations.event_type IS 'Type of wedding ceremony (determines default labels for events)';
COMMENT ON COLUMN wedding_registrations.timezone IS 'Timezone for event times (WIB/WITA/WIT)';
-- Migration: 011_create_greeting_sections.sql
-- Description: Create greeting_sections table for opening greetings, quotes, verses
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: greeting_sections
-- ============================================================================

CREATE TABLE IF NOT EXISTS greeting_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  -- Section identifier (e.g., 'opening', 'verse', 'welcome', 'quote')
  section_key VARCHAR(50) NOT NULL,
  
  -- Display order
  display_order INTEGER NOT NULL DEFAULT 1,
  
  -- Content
  title TEXT,
  subtitle TEXT,
  
  -- Optional: couple name display (for opening section)
  show_bride_name BOOLEAN DEFAULT false,
  show_groom_name BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_greeting_section_key UNIQUE(registration_id, section_key)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_greeting_sections_registration 
  ON greeting_sections(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_greeting_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_greeting_sections_updated_at
  BEFORE UPDATE ON greeting_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_greeting_sections_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE greeting_sections IS 'Greeting messages, verses, quotes displayed in the invitation';
COMMENT ON COLUMN greeting_sections.section_key IS 'Identifier for the section type (opening, verse, quote, etc.)';
COMMENT ON COLUMN greeting_sections.display_order IS 'Order in which sections appear on the page';
-- Migration: 012_create_love_story_tables.sql
-- Description: Create love_story_settings and love_story_blocks tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: love_story_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS love_story_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  main_title VARCHAR(255) DEFAULT 'Our Love Story',
  background_image_url TEXT,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.60 CHECK (overlay_opacity BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: love_story_blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS love_story_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  block_title VARCHAR(255) NOT NULL,
  block_body TEXT NOT NULL,
  story_date DATE, -- Optional: when this moment happened
  display_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_love_story_blocks_registration 
  ON love_story_blocks(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_love_story_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_love_story_settings_updated_at
  BEFORE UPDATE ON love_story_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_love_story_settings_updated_at();

CREATE OR REPLACE FUNCTION update_love_story_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_love_story_blocks_updated_at
  BEFORE UPDATE ON love_story_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_love_story_blocks_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE love_story_settings IS 'Settings for love story section (title, background, overlay)';
COMMENT ON TABLE love_story_blocks IS 'Individual story blocks/chapters in the love story section';
COMMENT ON COLUMN love_story_blocks.story_date IS 'Optional date when this moment in the story happened';
-- Migration: 013_create_gallery_settings.sql
-- Description: Create gallery_settings table
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: gallery_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  main_title VARCHAR(255) DEFAULT 'Our Moments',
  background_color VARCHAR(50) DEFAULT '#F5F5F0',
  show_youtube BOOLEAN DEFAULT false,
  youtube_embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_gallery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gallery_settings_updated_at
  BEFORE UPDATE ON gallery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gallery_settings IS 'Settings for gallery section. Photos are stored in client_media table.';
COMMENT ON COLUMN gallery_settings.youtube_embed_url IS 'URL for embedded YouTube video in gallery';
-- Migration: 014_create_wedding_gift_tables.sql
-- Description: Create wedding_gift_settings and wedding_gift_bank_accounts tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: wedding_gift_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_gift_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Wedding Gift',
  subtitle TEXT DEFAULT 'Doa restu Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi hadiah, dapat melalui:',
  button_label VARCHAR(100) DEFAULT 'Kirim Hadiah',
  gift_image_url TEXT,
  background_overlay_opacity DECIMAL(3,2) DEFAULT 0.55 CHECK (background_overlay_opacity BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: wedding_gift_bank_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_gift_bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gift_bank_accounts_registration 
  ON wedding_gift_bank_accounts(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wedding_gift_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wedding_gift_settings_updated_at
  BEFORE UPDATE ON wedding_gift_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_gift_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wedding_gift_settings IS 'Settings and text for wedding gift section';
COMMENT ON TABLE wedding_gift_bank_accounts IS 'Bank account details for digital wedding gifts';
COMMENT ON COLUMN wedding_gift_bank_accounts.bank_name IS 'Bank name (BCA, Mandiri, BNI, etc.)';
-- Migration: 015_create_closing_and_music_tables.sql
-- Description: Create closing_settings and background_music_settings tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: closing_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS closing_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  background_color VARCHAR(50) DEFAULT '#F5F5F0',
  photo_url TEXT,
  names_display VARCHAR(255),
  message_line1 TEXT DEFAULT 'Kami sangat menantikan kehadiran Anda untuk berbagi kebahagiaan di hari istimewa kami.',
  message_line2 TEXT DEFAULT 'Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: background_music_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_music_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  media_id INTEGER REFERENCES client_media(id) ON DELETE SET NULL,
  
  -- Metadata
  title VARCHAR(255),
  artist VARCHAR(255),
  loop_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_closing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_closing_settings_updated_at
  BEFORE UPDATE ON closing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_settings_updated_at();

CREATE OR REPLACE FUNCTION update_background_music_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_background_music_settings_updated_at
  BEFORE UPDATE ON background_music_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_background_music_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE closing_settings IS 'Settings and messages for the closing section';
COMMENT ON TABLE background_music_settings IS 'Background music configuration. References client_media table for the audio file.';
COMMENT ON COLUMN background_music_settings.media_id IS 'Foreign key to client_media table where file_type=music';
-- Migration: 016_create_theme_settings.sql
-- Description: Create theme_settings table for theme selection and customization
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: theme_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS theme_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  theme_key VARCHAR(100) DEFAULT 'premium/simple1',
  custom_images JSONB, -- Theme-specific image overrides (varies per theme)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_theme_settings_updated_at
  BEFORE UPDATE ON theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE theme_settings IS 'Theme selection and theme-specific customizations';
COMMENT ON COLUMN theme_settings.theme_key IS 'Selected theme identifier (e.g., premium/simple1, premium/elegant)';
COMMENT ON COLUMN theme_settings.custom_images IS 'JSON object containing theme-specific image URL overrides';
-- Migration: 017_migrate_existing_data.sql
-- Description: Migrate existing data from invitation_contents to new structured tables
-- Date: 2026-02-02
-- IMPORTANT: Run this AFTER all table creation migrations (010-016)

-- ============================================================================
-- STEP 1: Migrate to wedding_registrations
-- ============================================================================

-- This migration extracts data from invitation_contents JSONB columns
-- and populates the new structured tables

INSERT INTO wedding_registrations (
  slug,
  client_id,
  event_type,
  wedding_date,
  timezone,
  -- Bride
  bride_name,
  bride_full_name,
  bride_father_name,
  bride_mother_name,
  bride_instagram,
  -- Groom
  groom_name,
  groom_full_name,
  groom_father_name,
  groom_mother_name,
  groom_instagram,
  -- Event 1 (Holy Matrimony/Akad)
  event1_title,
  event1_date,
  event1_start_time,
  event1_end_time,
  event1_venue_name,
  event1_venue_address,
  event1_maps_url,
  -- Event 2 (Reception)
  event2_title,
  event2_date,
  event2_start_time,
  event2_end_time,
  event2_venue_name,
  event2_venue_address,
  event2_maps_url,
  -- Streaming
  streaming_enabled,
  streaming_url,
  streaming_description,
  streaming_button_label,
  created_at,
  updated_at
)
SELECT 
  ic.slug,
  c.id as client_id,
  'islam' as event_type, -- Default, can be updated manually if needed
  (ic.event->>'isoDate')::DATE as wedding_date,
  'WIB' as timezone, -- Default
  -- Bride
  ic.bride->>'name' as bride_name,
  ic.bride->>'fullName' as bride_full_name,
  ic.bride->>'fatherName' as bride_father_name,
  ic.bride->>'motherName' as bride_mother_name,
  ic.bride->>'instagram' as bride_instagram,
  -- Groom
  ic.groom->>'name' as groom_name,
  ic.groom->>'fullName' as groom_full_name,
  ic.groom->>'fatherName' as groom_father_name,
  ic.groom->>'motherName' as groom_mother_name,
  ic.groom->>'instagram' as groom_instagram,
  -- Event 1 (Holy Matrimony/Akad)
  COALESCE(ic.event_cloud->'holyMatrimony'->>'title', 'Akad Nikah') as event1_title,
  (ic.event->>'isoDate')::DATE as event1_date,
  '08:00:00'::TIME as event1_start_time, -- Default, extract from timeLabel if needed
  NULL as event1_end_time,
  ic.event_cloud->'holyMatrimony'->>'venueName' as event1_venue_name,
  ic.event_cloud->'holyMatrimony'->>'venueAddress' as event1_venue_address,
  ic.event_cloud->'holyMatrimony'->>'mapsUrl' as event1_maps_url,
  -- Event 2 (Reception)
  COALESCE(ic.event_cloud->'reception'->>'title', 'Resepsi') as event2_title,
  (ic.event->>'isoDate')::DATE as event2_date, -- Assuming same date, update if different
  '12:00:00'::TIME as event2_start_time, -- Default
  NULL as event2_end_time,
  ic.event_cloud->'reception'->>'venueName' as event2_venue_name,
  ic.event_cloud->'reception'->>'venueAddress' as event2_venue_address,
  ic.event_cloud->'reception'->>'mapsUrl' as event2_maps_url,
  -- Streaming
  CASE WHEN ic.event_cloud->'streaming'->>'url' IS NOT NULL AND ic.event_cloud->'streaming'->>'url' != '' 
       THEN true ELSE false END as streaming_enabled,
  ic.event_cloud->'streaming'->>'url' as streaming_url,
  ic.event_cloud->'streaming'->>'description' as streaming_description,
  COALESCE(ic.event_cloud->'streaming'->>'buttonLabel', 'Watch Live') as streaming_button_label,
  ic.created_at,
  ic.updated_at
FROM invitation_contents ic
LEFT JOIN clients c ON c.slug = ic.slug
WHERE ic.bride IS NOT NULL AND ic.groom IS NOT NULL
ON CONFLICT (slug) DO NOTHING; -- Skip if already exists

-- ============================================================================
-- STEP 2: Migrate greeting_sections (from clouds)
-- ============================================================================

-- Extract greeting sections from clouds JSONB
-- This is a bit complex as clouds structure may vary
-- We'll extract section0 and section4 as examples

-- Section 0 (opening greeting)
INSERT INTO greeting_sections (
  registration_id,
  section_key,
  display_order,
  title,
  subtitle,
  show_bride_name,
  show_groom_name
)
SELECT 
  wr.id as registration_id,
  'opening' as section_key,
  1 as display_order,
  ic.clouds->'section0'->>'title' as title,
  ic.clouds->'section0'->>'subtitle' as subtitle,
  true as show_bride_name,
  true as show_groom_name
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.clouds->'section0' IS NOT NULL
ON CONFLICT (registration_id, section_key) DO NOTHING;

-- Section 4 (verse/quote)
INSERT INTO greeting_sections (
  registration_id,
  section_key,
  display_order,
  title,
  subtitle,
  show_bride_name,
  show_groom_name
)
SELECT 
  wr.id as registration_id,
  'verse' as section_key,
  2 as display_order,
  ic.clouds->'section4'->>'title' as title,
  ic.clouds->'section4'->>'subtitle' as subtitle,
  false as show_bride_name,
  false as show_groom_name
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.clouds->'section4' IS NOT NULL
ON CONFLICT (registration_id, section_key) DO NOTHING;

-- ============================================================================
-- STEP 3: Migrate love_story_settings
-- ============================================================================

INSERT INTO love_story_settings (
  registration_id,
  main_title,
  background_image_url,
  overlay_opacity
)
SELECT 
  wr.id as registration_id,
  COALESCE(ic.love_story->>'mainTitle', 'Our Love Story') as main_title,
  ic.love_story->>'backgroundImage' as background_image_url,
  COALESCE((ic.love_story->>'overlayOpacity')::DECIMAL, 0.60) as overlay_opacity
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.love_story IS NOT NULL
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Migrate love_story_blocks
-- ============================================================================

-- Extract blocks from love_story JSONB array
INSERT INTO love_story_blocks (
  registration_id,
  block_title,
  block_body,
  display_order
)
SELECT 
  wr.id as registration_id,
  block->>'title' as block_title,
  block->>'body' as block_body,
  ROW_NUMBER() OVER (PARTITION BY wr.id ORDER BY block_index) as display_order
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
CROSS JOIN LATERAL jsonb_array_elements(ic.love_story->'blocks') WITH ORDINALITY AS blocks(block, block_index)
WHERE ic.love_story->'blocks' IS NOT NULL;

-- ============================================================================
-- STEP 5: Migrate gallery_settings
-- ============================================================================

INSERT INTO gallery_settings (
  registration_id,
  main_title,
  background_color,
  show_youtube,
  youtube_embed_url
)
SELECT 
  wr.id as registration_id,
  COALESCE(ic.gallery->>'mainTitle', 'Our Moments') as main_title,
  COALESCE(ic.gallery->>'backgroundColor', '#F5F5F0') as background_color,
  COALESCE((ic.gallery->>'showYoutube')::BOOLEAN, false) as show_youtube,
  ic.gallery->>'youtubeEmbedUrl' as youtube_embed_url
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.gallery IS NOT NULL
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Migrate wedding_gift_settings
-- ============================================================================

INSERT INTO wedding_gift_settings (
  registration_id,
  title,
  subtitle,
  button_label,
  gift_image_url,
  background_overlay_opacity
)
SELECT 
  wr.id as registration_id,
  COALESCE(ic.wedding_gift->>'title', 'Wedding Gift') as title,
  ic.wedding_gift->>'subtitle' as subtitle,
  COALESCE(ic.wedding_gift->>'buttonLabel', 'Kirim Hadiah') as button_label,
  ic.wedding_gift->>'giftImageSrc' as gift_image_url,
  COALESCE((ic.wedding_gift->>'backgroundOverlayOpacity')::DECIMAL, 0.55) as background_overlay_opacity
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.wedding_gift IS NOT NULL
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Migrate wedding_gift_bank_accounts
-- ============================================================================

INSERT INTO wedding_gift_bank_accounts (
  registration_id,
  bank_name,
  account_number,
  account_holder_name,
  display_order
)
SELECT 
  wr.id as registration_id,
  CASE 
    WHEN account->>'templateId' = 'bca' THEN 'BCA'
    WHEN account->>'templateId' = 'mandiri' THEN 'Mandiri'
    WHEN account->>'templateId' = 'bni' THEN 'BNI'
    WHEN account->>'templateId' = 'bri' THEN 'BRI'
    ELSE UPPER(account->>'templateId')
  END as bank_name,
  account->>'accountNumber' as account_number,
  account->>'accountName' as account_holder_name,
  ROW_NUMBER() OVER (PARTITION BY wr.id ORDER BY account_index) as display_order
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
CROSS JOIN LATERAL jsonb_array_elements(ic.wedding_gift->'bankAccounts') WITH ORDINALITY AS accounts(account, account_index)
WHERE ic.wedding_gift->'bankAccounts' IS NOT NULL;

-- ============================================================================
-- STEP 8: Migrate closing_settings
-- ============================================================================

INSERT INTO closing_settings (
  registration_id,
  background_color,
  photo_url,
  names_display,
  message_line1,
  message_line2
)
SELECT 
  wr.id as registration_id,
  COALESCE(ic.closing->>'backgroundColor', '#F5F5F0') as background_color,
  ic.closing->>'photoSrc' as photo_url,
  ic.closing->>'namesScript' as names_display,
  ic.closing->'messageLines'->>0 as message_line1,
  ic.closing->'messageLines'->>1 as message_line2
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.closing IS NOT NULL
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- STEP 9: Migrate background_music_settings
-- ============================================================================

INSERT INTO background_music_settings (
  registration_id,
  media_id,
  title,
  artist,
  loop_enabled
)
SELECT 
  wr.id as registration_id,
  NULL as media_id, -- Will need to be linked manually or via separate process
  ic.background_music->>'title' as title,
  ic.background_music->>'artist' as artist,
  COALESCE((ic.background_music->>'loop')::BOOLEAN, true) as loop_enabled
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
WHERE ic.background_music IS NOT NULL
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- STEP 10: Migrate theme_settings
-- ============================================================================

INSERT INTO theme_settings (
  registration_id,
  theme_key,
  custom_images
)
SELECT 
  wr.id as registration_id,
  COALESCE(ic.theme_key, 'premium/simple1') as theme_key,
  ic.custom_images as custom_images
FROM invitation_contents ic
JOIN wedding_registrations wr ON wr.slug = ic.slug
ON CONFLICT (registration_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- After running this migration:
-- 1. Verify data integrity: SELECT COUNT(*) FROM each new table
-- 2. Check for any NULL values that should have defaults
-- 3. Manually review any complex data that may not have migrated cleanly
-- 4. Update invitation_contents JSON cache using the compile service
