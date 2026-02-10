-- Migration: 019_add_client_approval_and_email_verification.sql
-- Description: Add fields for admin approval workflow and email verification
-- Date: 2026-02-10

-- ============================================================================
-- Add Client Approval and Email Verification Fields
-- ============================================================================

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES admins(id),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- ============================================================================
-- Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_is_published ON clients(is_published);
CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON clients(payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_email_verified ON clients(email_verified);
CREATE INDEX IF NOT EXISTS idx_clients_email_verification_token ON clients(email_verification_token);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN clients.is_published IS 'Whether the client invitation is published and publicly accessible';
COMMENT ON COLUMN clients.payment_status IS 'Payment verification status: pending, verified, failed';
COMMENT ON COLUMN clients.email_verified IS 'Whether the client email has been verified';
COMMENT ON COLUMN clients.email_verification_token IS 'Token for email verification (expires after 24 hours)';
