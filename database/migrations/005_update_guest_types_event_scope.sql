-- Migration: Update Guest Types for Event-Level Scope
-- Description: Support both client-level and event-level guest types
-- Date: 2025-01-07

-- Add event_id column to guest_types (NULL = client-level default, NOT NULL = event-specific)
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS event_id UUID;

-- Add foreign key constraint to events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_guest_types_event'
    ) THEN
        ALTER TABLE guest_types
        ADD CONSTRAINT fk_guest_types_event
            FOREIGN KEY (event_id)
            REFERENCES events(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Update unique constraint to include event_id
ALTER TABLE guest_types DROP CONSTRAINT IF EXISTS unique_guest_type_per_client;
ALTER TABLE guest_types DROP CONSTRAINT IF EXISTS unique_guest_type_per_client_event;

-- Create new unique constraint
ALTER TABLE guest_types 
ADD CONSTRAINT unique_guest_type_per_client_event
    UNIQUE (client_id, event_id, type_name);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_guest_types_event_id ON guest_types(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_types_client_event ON guest_types(client_id, event_id);

-- Function to create default guest types for new event
CREATE OR REPLACE FUNCTION create_default_guest_types_for_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if guestbook is enabled
    IF NEW.has_guestbook = TRUE THEN
        -- Create REGULAR guest type
        INSERT INTO guest_types (client_id, event_id, type_name, display_name, color_code, priority_order)
        VALUES (NEW.client_id, NEW.id, 'REGULAR', 'Regular', '#10b981', 1)
        ON CONFLICT (client_id, event_id, type_name) DO NOTHING;
        
        -- Create VIP guest type
        INSERT INTO guest_types (client_id, event_id, type_name, display_name, color_code, priority_order)
        VALUES (NEW.client_id, NEW.id, 'VIP', 'VIP', '#f59e0b', 2)
        ON CONFLICT (client_id, event_id, type_name) DO NOTHING;
        
        -- Create VVIP guest type
        INSERT INTO guest_types (client_id, event_id, type_name, display_name, color_code, priority_order)
        VALUES (NEW.client_id, NEW.id, 'VVIP', 'VVIP', '#8b5cf6', 3)
        ON CONFLICT (client_id, event_id, type_name) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create guest types when new event is created
DROP TRIGGER IF EXISTS trigger_create_default_guest_types ON events;
CREATE TRIGGER trigger_create_default_guest_types
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_default_guest_types_for_event();

-- Add comments
COMMENT ON COLUMN guest_types.event_id IS 'Event ID for event-specific guest types (NULL = client-level default)';
COMMENT ON FUNCTION create_default_guest_types_for_event() IS 'Auto-create default guest types (REGULAR, VIP, VVIP) when new event with guestbook is created';
