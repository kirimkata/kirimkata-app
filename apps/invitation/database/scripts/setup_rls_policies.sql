-- Setup Row Level Security (RLS) Policies for Supabase
-- This protects your data while allowing controlled public access

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE invitation_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INVITATION_CONTENTS TABLE
-- Public can read (for invitation pages)
-- Only service role can modify
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can read invitation contents" ON invitation_contents;
DROP POLICY IF EXISTS "Service role full access to invitation contents" ON invitation_contents;

-- Public read-only access
CREATE POLICY "Public can read invitation contents"
ON invitation_contents
FOR SELECT
TO anon, authenticated
USING (true);

-- Service role full access
CREATE POLICY "Service role full access to invitation contents"
ON invitation_contents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- WISHES TABLE
-- Public can read and insert (for guest wishes)
-- Only service role can update/delete
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can read wishes" ON wishes;
DROP POLICY IF EXISTS "Public can insert wishes" ON wishes;
DROP POLICY IF EXISTS "Service role full access to wishes" ON wishes;

-- Public can read all wishes
CREATE POLICY "Public can read wishes"
ON wishes
FOR SELECT
TO anon, authenticated
USING (true);

-- Public can insert wishes (guests submitting wishes)
CREATE POLICY "Public can insert wishes"
ON wishes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access to wishes"
ON wishes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- CLIENTS TABLE
-- ONLY service role can access (sensitive data)
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role only access to clients" ON clients;

-- Only service role has access
CREATE POLICY "Service role only access to clients"
ON clients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ADMINS TABLE
-- ONLY service role can access (sensitive data)
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role only access to admins" ON admins;

-- Only service role has access
CREATE POLICY "Service role only access to admins"
ON admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify RLS is properly configured
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('invitation_contents', 'wishes', 'clients', 'admins')
ORDER BY tablename;

-- Check all policies
SELECT 
    schemaname,
    tablename, 
    policyname, 
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- RLS Enabled Check:
-- All 4 tables should show rls_enabled = true

-- Policies Check:
-- invitation_contents: 2 policies (public read, service role all)
-- wishes: 3 policies (public read, public insert, service role all)
-- clients: 1 policy (service role only)
-- admins: 1 policy (service role only)
