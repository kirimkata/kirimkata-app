-- Add message_template column to clients table
-- Default is NULL (empty), UI will show default template if null
ALTER TABLE clients 
ADD COLUMN message_template TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN clients.message_template IS 'WhatsApp message template with variables: {nama}, {nomor}, {link}. NULL = use default template in UI';
