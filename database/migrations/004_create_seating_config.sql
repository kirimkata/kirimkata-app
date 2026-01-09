-- Migration: Create Event Seating Configuration Table
-- Description: Table untuk manage seats/tables/zones per event
-- Date: 2025-01-07

-- Create event_seating_config table
CREATE TABLE IF NOT EXISTS event_seating_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    seating_type VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 1,
    allowed_guest_type_ids UUID[] DEFAULT '{}',
    position_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_seating_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    
    CONSTRAINT check_seating_type
        CHECK (seating_type IN ('table', 'seat', 'zone')),
    
    CONSTRAINT check_capacity_positive
        CHECK (capacity > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_seating_config_event_id ON event_seating_config(event_id);
CREATE INDEX IF NOT EXISTS idx_event_seating_config_type ON event_seating_config(seating_type);
CREATE INDEX IF NOT EXISTS idx_event_seating_config_active ON event_seating_config(is_active);
CREATE INDEX IF NOT EXISTS idx_event_seating_config_sort_order ON event_seating_config(event_id, sort_order);

-- Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_seating_config_updated_at ON event_seating_config;
CREATE TRIGGER trigger_update_seating_config_updated_at
    BEFORE UPDATE ON event_seating_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE event_seating_config IS 'Seating configuration per event (tables, seats, zones)';
COMMENT ON COLUMN event_seating_config.seating_type IS 'Type of seating unit: table, seat, or zone';
COMMENT ON COLUMN event_seating_config.name IS 'Display name (e.g., "Table 1", "Seat A1", "VIP Zone")';
COMMENT ON COLUMN event_seating_config.capacity IS 'Maximum number of guests for this seating unit';
COMMENT ON COLUMN event_seating_config.allowed_guest_type_ids IS 'Array of guest type IDs allowed for this seat/table/zone (empty = all allowed)';
COMMENT ON COLUMN event_seating_config.position_data IS 'JSON data for visual positioning (x, y, floor, etc.)';
COMMENT ON COLUMN event_seating_config.sort_order IS 'Display order for sorting';
