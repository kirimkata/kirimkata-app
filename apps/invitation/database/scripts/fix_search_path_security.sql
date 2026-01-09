-- Fix search_path security vulnerability for trigger functions
-- This prevents search_path injection attacks

-- Drop existing functions
DROP FUNCTION IF EXISTS update_admins_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_clients_updated_at() CASCADE;

-- Recreate update_admins_updated_at with secure search_path
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for admins
CREATE TRIGGER trigger_update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_admins_updated_at();

-- Recreate update_clients_updated_at with secure search_path
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for clients
CREATE TRIGGER trigger_update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_clients_updated_at();

-- Verify the functions have been created with proper security settings
-- You can check in Supabase SQL Editor with:
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname LIKE '%updated_at%';
