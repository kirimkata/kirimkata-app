-- Migration: Add Module Flags to Events Table
-- Description: Add support for module-based events (Invitation & Guestbook)
-- Date: 2025-01-07

-- Add module flags
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_invitation BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_guestbook BOOLEAN DEFAULT FALSE;

-- Add configuration JSON columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_config JSONB DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS guestbook_config JSONB DEFAULT '{}';

-- Add seating mode
ALTER TABLE events ADD COLUMN IF NOT EXISTS seating_mode VARCHAR(20) DEFAULT 'no_seat';
-- Options: 'no_seat', 'table_based', 'numbered_seat', 'zone_based'

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_has_invitation ON events(has_invitation);
CREATE INDEX IF NOT EXISTS idx_events_has_guestbook ON events(has_guestbook);
CREATE INDEX IF NOT EXISTS idx_events_seating_mode ON events(seating_mode);

-- Update existing events to have both modules enabled by default
UPDATE events 
SET has_invitation = TRUE, 
    has_guestbook = TRUE 
WHERE has_invitation IS NULL OR has_guestbook IS NULL;

-- Add check constraint for seating mode
ALTER TABLE events 
ADD CONSTRAINT check_seating_mode 
CHECK (seating_mode IN ('no_seat', 'table_based', 'numbered_seat', 'zone_based'));

-- Add comments for documentation
COMMENT ON COLUMN events.has_invitation IS 'Enable invitation module for this event';
COMMENT ON COLUMN events.has_guestbook IS 'Enable guestbook module for this event';
COMMENT ON COLUMN events.invitation_config IS 'JSON configuration for invitation module (rsvp_enabled, max_guests_per_invitation, auto_generate_qr)';
COMMENT ON COLUMN events.guestbook_config IS 'JSON configuration for guestbook module (checkin_mode, offline_support, qr_validation)';
COMMENT ON COLUMN events.seating_mode IS 'Seating arrangement mode: no_seat, table_based, numbered_seat, zone_based';
