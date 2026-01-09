# FASE 1: Database Schema Enhancement

## Objective
Menyempurnakan database schema untuk mendukung module-based events (Invitation & Guestbook) sesuai PRD.

## Duration: 2-3 hari

---

## Task 1.1: Add Module Flags to Events Table

### SQL Migration Script
```sql
-- File: database/migrations/003_add_event_modules.sql

-- Add module flags
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_invitation BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_guestbook BOOLEAN DEFAULT FALSE;

-- Add configuration JSON columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS invitation_config JSONB DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS guestbook_config JSONB DEFAULT '{}';

-- Add seating mode
ALTER TABLE events ADD COLUMN IF NOT EXISTS seating_mode VARCHAR(20) DEFAULT 'no_seat';
-- Options: 'no_seat', 'table_based', 'numbered_seat', 'zone_based'

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_has_invitation ON events(has_invitation);
CREATE INDEX IF NOT EXISTS idx_events_has_guestbook ON events(has_guestbook);
CREATE INDEX IF NOT EXISTS idx_events_seating_mode ON events(seating_mode);

-- Update existing events to have both modules enabled
UPDATE events SET has_invitation = TRUE, has_guestbook = TRUE WHERE has_invitation IS NULL;

COMMENT ON COLUMN events.has_invitation IS 'Enable invitation module for this event';
COMMENT ON COLUMN events.has_guestbook IS 'Enable guestbook module for this event';
COMMENT ON COLUMN events.seating_mode IS 'Seating arrangement mode: no_seat, table_based, numbered_seat, zone_based';
```

### TypeScript Type Update
File: `apps/invitation/lib/guestbook/types.ts`

```typescript
export interface Event {
  id: string;
  client_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  is_active: boolean;
  
  // NEW: Module flags
  has_invitation: boolean;
  has_guestbook: boolean;
  
  // NEW: Module configurations
  invitation_config: {
    rsvp_enabled?: boolean;
    max_guests_per_invitation?: number;
    auto_generate_qr?: boolean;
  };
  guestbook_config: {
    checkin_mode?: 'qr_scan' | 'manual' | 'both';
    offline_support?: boolean;
    qr_validation?: 'strict' | 'loose';
  };
  
  // NEW: Seating mode
  seating_mode: 'no_seat' | 'table_based' | 'numbered_seat' | 'zone_based';
  
  staff_quota: number;
  staff_quota_used: number;
  created_at: string;
  updated_at: string;
}
```

---

## Task 1.2: Create Event Seating Configuration Table

### SQL Migration Script
```sql
-- File: database/migrations/004_create_seating_config.sql

-- Table untuk manage seats/tables/zones per event
CREATE TABLE IF NOT EXISTS event_seating_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    seating_type VARCHAR(20) NOT NULL, -- 'table', 'seat', 'zone'
    name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 1,
    allowed_guest_type_ids UUID[] DEFAULT '{}',
    position_data JSONB, -- untuk koordinat visual (x, y)
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_seating_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    
    CONSTRAINT check_seating_type
        CHECK (seating_type IN ('table', 'seat', 'zone'))
);

-- Indexes
CREATE INDEX idx_event_seating_config_event_id ON event_seating_config(event_id);
CREATE INDEX idx_event_seating_config_type ON event_seating_config(seating_type);
CREATE INDEX idx_event_seating_config_active ON event_seating_config(is_active);

-- Trigger untuk update updated_at
CREATE TRIGGER trigger_update_seating_config_updated_at
    BEFORE UPDATE ON event_seating_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE event_seating_config IS 'Seating configuration per event (tables, seats, zones)';
COMMENT ON COLUMN event_seating_config.allowed_guest_type_ids IS 'Array of guest type IDs allowed for this seat/table/zone';
```

### TypeScript Type
```typescript
export interface EventSeatingConfig {
  id: string;
  event_id: string;
  seating_type: 'table' | 'seat' | 'zone';
  name: string;
  capacity: number;
  allowed_guest_type_ids: string[];
  position_data?: {
    x?: number;
    y?: number;
    floor?: string;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

---

## Task 1.3: Update Guest Types for Event-Level Scope

### SQL Migration Script
```sql
-- File: database/migrations/005_update_guest_types_event_scope.sql

-- Guest types should support both client-level and event-level
-- Add event_id as optional (NULL = client-level default, NOT NULL = event-specific)
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS event_id UUID;

-- Add foreign key constraint
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
ALTER TABLE guest_types ADD CONSTRAINT unique_guest_type_per_client_event
    UNIQUE (client_id, event_id, type_name);

-- Add index
CREATE INDEX IF NOT EXISTS idx_guest_types_event_id ON guest_types(event_id);

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

-- Trigger to auto-create guest types
DROP TRIGGER IF EXISTS trigger_create_default_guest_types ON events;
CREATE TRIGGER trigger_create_default_guest_types
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_default_guest_types_for_event();
```

---

## Task 1.4: Update Invitation Guests Table

### SQL Migration Script
```sql
-- File: database/migrations/006_update_invitation_guests.sql

-- Ensure all guestbook-related columns exist
-- Most already exist from CREATE_TABLES_FIXED.sql, but verify:

-- Add guest_group for grouping (e.g., "Family A", "Office Team")
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS guest_group VARCHAR(100);

-- Add max_companions and actual_companions if not exists
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS max_companions INTEGER DEFAULT 0;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS actual_companions INTEGER DEFAULT 0;

-- Add seating reference to event_seating_config
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS seating_config_id UUID;

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

CREATE INDEX IF NOT EXISTS idx_invitation_guests_seating_config ON invitation_guests(seating_config_id);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_guest_group ON invitation_guests(guest_group);
```

---

## Task 1.5: Create Benefits Management Tables

### SQL Migration Script
```sql
-- File: database/migrations/007_enhance_benefits.sql

-- Update guest_type_benefits to be more flexible
-- Current structure is good, but add more metadata

ALTER TABLE guest_type_benefits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE guest_type_benefits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create benefits catalog table (optional, for predefined benefits)
CREATE TABLE IF NOT EXISTS benefit_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default benefits
INSERT INTO benefit_catalog (benefit_key, display_name, description, icon, sort_order) VALUES
('souvenir', 'Souvenir', 'Hak mengambil souvenir', '🎁', 1),
('snack', 'Konsumsi/Snack', 'Hak mendapat konsumsi', '🍽️', 2),
('vip_lounge', 'VIP Lounge', 'Akses ke ruang VIP', '👑', 3),
('parking', 'Parkir Khusus', 'Akses parkir khusus', '🅿️', 4),
('priority_checkin', 'Priority Check-in', 'Check-in prioritas', '⚡', 5)
ON CONFLICT (benefit_key) DO NOTHING;

CREATE INDEX idx_benefit_catalog_sort_order ON benefit_catalog(sort_order);
```

---

## Validation Checklist

### Database
- [ ] Run all migration scripts on dev database
- [ ] Verify all new columns exist
- [ ] Verify all indexes created
- [ ] Verify triggers working
- [ ] Test default guest type creation on new event

### TypeScript Types
- [ ] Update all type definitions
- [ ] Update repository functions
- [ ] No TypeScript errors

### Testing
- [ ] Create test event with modules
- [ ] Verify guest types auto-created
- [ ] Test seating config CRUD
- [ ] Test benefit catalog

---

## Files to Create/Update

### New Files
- `database/migrations/003_add_event_modules.sql`
- `database/migrations/004_create_seating_config.sql`
- `database/migrations/005_update_guest_types_event_scope.sql`
- `database/migrations/006_update_invitation_guests.sql`
- `database/migrations/007_enhance_benefits.sql`

### Update Files
- `apps/invitation/lib/guestbook/types.ts`
- `docs/CREATE_TABLES_FIXED.sql` (add new schema)

---

## Next Steps
After FASE 1 complete, proceed to FASE 2: Routing Restructure
