-- Migration: Update Invitation Guests Table
-- Description: Add guestbook-related columns and seating reference
-- Date: 2025-01-07

-- Add guest_group for grouping (e.g., "Family A", "Office Team")
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS guest_group VARCHAR(100);

-- Add max_companions and actual_companions if not exists
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS max_companions INTEGER DEFAULT 0;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS actual_companions INTEGER DEFAULT 0;

-- Add seating reference to event_seating_config
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS seating_config_id UUID;

-- Add foreign key constraint to event_seating_config
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invitation_guests_seating_config'
    ) THEN
        ALTER TABLE invitation_guests
        ADD CONSTRAINT fk_invitation_guests_seating_config
            FOREIGN KEY (seating_config_id)
            REFERENCES event_seating_config(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraint for companions
ALTER TABLE invitation_guests DROP CONSTRAINT IF EXISTS check_companions_valid;
ALTER TABLE invitation_guests 
ADD CONSTRAINT check_companions_valid 
CHECK (actual_companions >= 0 AND actual_companions <= max_companions);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invitation_guests_seating_config ON invitation_guests(seating_config_id);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_guest_group ON invitation_guests(guest_group);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_event_group ON invitation_guests(event_id, guest_group);

-- Add comments for documentation
COMMENT ON COLUMN invitation_guests.guest_group IS 'Group identifier for related guests (e.g., "Family A", "Office Team")';
COMMENT ON COLUMN invitation_guests.max_companions IS 'Maximum number of companions allowed for this guest';
COMMENT ON COLUMN invitation_guests.actual_companions IS 'Actual number of companions attending (from RSVP)';
COMMENT ON COLUMN invitation_guests.seating_config_id IS 'Reference to assigned seat/table/zone in event_seating_config';
