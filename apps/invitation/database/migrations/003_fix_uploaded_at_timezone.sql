-- Migration to fix uploaded_at column timezone
-- This will convert existing TIMESTAMP column to TIMESTAMPTZ

-- Step 1: Alter the column type to TIMESTAMPTZ
ALTER TABLE client_media 
  ALTER COLUMN uploaded_at TYPE TIMESTAMPTZ 
  USING uploaded_at AT TIME ZONE 'UTC';

-- Note: This assumes existing timestamps in the database are in UTC
-- If they are in WIB (Asia/Jakarta), use:
-- USING uploaded_at AT TIME ZONE 'Asia/Jakarta';
