-- Update existing message_template column to remove default value
-- This makes it NULL for new clients, while keeping existing data

-- Remove default value (set to NULL)
ALTER TABLE clients 
ALTER COLUMN message_template DROP DEFAULT;

-- Update existing rows that have the old default to NULL (optional)
-- Uncomment if you want to reset all clients to use the default template from UI
-- UPDATE clients SET message_template = NULL WHERE message_template = 'Halo {nama},...';

-- Add comment
COMMENT ON COLUMN clients.message_template IS 'WhatsApp message template with variables: {nama}, {nomor}, {link}. NULL = use default template in UI';
