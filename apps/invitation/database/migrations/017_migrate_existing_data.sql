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
