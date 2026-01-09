-- Add 'sent' column to invitation_guests table
-- This column tracks whether a WhatsApp invitation has been sent to the guest

ALTER TABLE invitation_guests 
ADD COLUMN IF NOT EXISTS sent BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN invitation_guests.sent IS 'Indicates whether WhatsApp invitation has been sent to this guest';
