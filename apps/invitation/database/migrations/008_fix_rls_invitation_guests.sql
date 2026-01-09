-- Simplified RLS Policies for invitation_guests
-- Since we're using custom auth (not Supabase Auth), we'll use service role in API
-- and simpler RLS policies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Clients can view own guests" ON invitation_guests;
DROP POLICY IF EXISTS "Clients can insert own guests" ON invitation_guests;
DROP POLICY IF EXISTS "Clients can update own guests" ON invitation_guests;
DROP POLICY IF EXISTS "Clients can delete own guests" ON invitation_guests;
DROP POLICY IF EXISTS "Admins can view all guests" ON invitation_guests;
DROP POLICY IF EXISTS "Admins can manage all guests" ON invitation_guests;

-- Disable RLS temporarily (we'll use service role key in API)
ALTER TABLE invitation_guests DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use service role key
-- The API will use service role key which bypasses RLS
-- This provides security at the API level instead of database level

-- Note: Make sure your API uses service role key from .env:
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
