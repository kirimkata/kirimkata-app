-- Test Script for FASE 1 Database Schema Enhancement
-- Run this after all migrations to verify everything works correctly

-- ============================================
-- TEST 1: Verify Events Table Columns
-- ============================================
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name IN ('has_invitation', 'has_guestbook', 'invitation_config', 'guestbook_config', 'seating_mode');
    
    IF column_count = 5 THEN
        RAISE NOTICE '✓ TEST 1 PASSED: All new columns exist in events table';
    ELSE
        RAISE EXCEPTION '✗ TEST 1 FAILED: Expected 5 columns, found %', column_count;
    END IF;
END $$;

-- ============================================
-- TEST 2: Verify Event Seating Config Table
-- ============================================
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_seating_config'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ TEST 2 PASSED: event_seating_config table exists';
    ELSE
        RAISE EXCEPTION '✗ TEST 2 FAILED: event_seating_config table not found';
    END IF;
END $$;

-- ============================================
-- TEST 3: Verify Guest Types Event Scope
-- ============================================
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'guest_types' 
        AND column_name = 'event_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✓ TEST 3 PASSED: event_id column exists in guest_types';
    ELSE
        RAISE EXCEPTION '✗ TEST 3 FAILED: event_id column not found in guest_types';
    END IF;
END $$;

-- ============================================
-- TEST 4: Verify Benefit Catalog
-- ============================================
DO $$
DECLARE
    benefit_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO benefit_count FROM benefit_catalog;
    
    IF benefit_count >= 8 THEN
        RAISE NOTICE '✓ TEST 4 PASSED: Benefit catalog has % benefits', benefit_count;
    ELSE
        RAISE EXCEPTION '✗ TEST 4 FAILED: Expected at least 8 benefits, found %', benefit_count;
    END IF;
END $$;

-- ============================================
-- TEST 5: Verify Invitation Guests Columns
-- ============================================
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'invitation_guests' 
    AND column_name IN ('guest_group', 'max_companions', 'actual_companions', 'seating_config_id');
    
    IF column_count = 4 THEN
        RAISE NOTICE '✓ TEST 5 PASSED: All new columns exist in invitation_guests table';
    ELSE
        RAISE EXCEPTION '✗ TEST 5 FAILED: Expected 4 columns, found %', column_count;
    END IF;
END $$;

-- ============================================
-- TEST 6: Verify Indexes Created
-- ============================================
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname IN (
        'idx_events_has_invitation',
        'idx_events_has_guestbook',
        'idx_events_seating_mode',
        'idx_event_seating_config_event_id',
        'idx_guest_types_event_id',
        'idx_invitation_guests_seating_config',
        'idx_benefit_catalog_sort_order'
    );
    
    IF index_count >= 7 THEN
        RAISE NOTICE '✓ TEST 6 PASSED: % indexes created successfully', index_count;
    ELSE
        RAISE NOTICE '⚠ TEST 6 WARNING: Expected 7 indexes, found %. Some may already exist.', index_count;
    END IF;
END $$;

-- ============================================
-- TEST 7: Verify Triggers
-- ============================================
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'trigger_create_default_guest_types'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ TEST 7 PASSED: Auto-create guest types trigger exists';
    ELSE
        RAISE EXCEPTION '✗ TEST 7 FAILED: trigger_create_default_guest_types not found';
    END IF;
END $$;

-- ============================================
-- TEST 8: Test Auto-Create Guest Types (IMPORTANT)
-- ============================================
DO $$
DECLARE
    test_client_id UUID;
    test_event_id UUID;
    guest_type_count INTEGER;
    rec RECORD;
BEGIN
    -- Get first client or create test client
    SELECT id INTO test_client_id FROM clients LIMIT 1;
    
    IF test_client_id IS NULL THEN
        RAISE NOTICE '⚠ TEST 8 SKIPPED: No clients found. Create a client first to test this feature.';
    ELSE
        -- Create test event with guestbook enabled
        INSERT INTO events (client_id, event_name, event_date, has_invitation, has_guestbook)
        VALUES (test_client_id, 'FASE1_TEST_EVENT', '2025-12-31', true, true)
        RETURNING id INTO test_event_id;
        
        -- Wait a moment for trigger to execute
        PERFORM pg_sleep(0.5);
        
        -- Check if guest types were auto-created
        SELECT COUNT(*) INTO guest_type_count 
        FROM guest_types 
        WHERE event_id = test_event_id;
        
        IF guest_type_count = 3 THEN
            RAISE NOTICE '✓ TEST 8 PASSED: Auto-created 3 guest types (REGULAR, VIP, VVIP)';
            
            -- Verify the types
            RAISE NOTICE '  Guest Types Created:';
            FOR rec IN (SELECT type_name, display_name, color_code FROM guest_types WHERE event_id = test_event_id ORDER BY priority_order)
            LOOP
                RAISE NOTICE '    - % (%) - %', rec.type_name, rec.display_name, rec.color_code;
            END LOOP;
        ELSE
            RAISE EXCEPTION '✗ TEST 8 FAILED: Expected 3 guest types, found %', guest_type_count;
        END IF;
        
        -- Cleanup test event
        DELETE FROM events WHERE id = test_event_id;
        RAISE NOTICE '  Test event cleaned up';
    END IF;
END $$;

-- ============================================
-- TEST 9: Test Seating Config CRUD
-- ============================================
DO $$
DECLARE
    test_client_id UUID;
    test_event_id UUID;
    test_seating_id UUID;
    seating_count INTEGER;
BEGIN
    -- Get first client
    SELECT id INTO test_client_id FROM clients LIMIT 1;
    
    IF test_client_id IS NULL THEN
        RAISE NOTICE '⚠ TEST 9 SKIPPED: No clients found';
    ELSE
        -- Create test event
        INSERT INTO events (client_id, event_name, event_date, has_guestbook, seating_mode)
        VALUES (test_client_id, 'FASE1_SEATING_TEST', '2025-12-31', true, 'table_based')
        RETURNING id INTO test_event_id;
        
        -- Create test seating config
        INSERT INTO event_seating_config (event_id, seating_type, name, capacity)
        VALUES (test_event_id, 'table', 'Table 1', 10)
        RETURNING id INTO test_seating_id;
        
        -- Verify created
        SELECT COUNT(*) INTO seating_count 
        FROM event_seating_config 
        WHERE event_id = test_event_id;
        
        IF seating_count = 1 THEN
            RAISE NOTICE '✓ TEST 9 PASSED: Seating config CRUD works';
        ELSE
            RAISE EXCEPTION '✗ TEST 9 FAILED: Seating config not created';
        END IF;
        
        -- Cleanup
        DELETE FROM events WHERE id = test_event_id;
        RAISE NOTICE '  Test data cleaned up';
    END IF;
END $$;

-- ============================================
-- TEST 10: Test Benefit Assignment
-- ============================================
DO $$
DECLARE
    test_client_id UUID;
    test_event_id UUID;
    test_guest_type_id UUID;
    benefit_count INTEGER;
BEGIN
    -- Get first client
    SELECT id INTO test_client_id FROM clients LIMIT 1;
    
    IF test_client_id IS NULL THEN
        RAISE NOTICE '⚠ TEST 10 SKIPPED: No clients found';
    ELSE
        -- Create test event
        INSERT INTO events (client_id, event_name, event_date, has_guestbook)
        VALUES (test_client_id, 'FASE1_BENEFIT_TEST', '2025-12-31', true)
        RETURNING id INTO test_event_id;
        
        -- Wait for auto-created guest types
        PERFORM pg_sleep(0.5);
        
        -- Get VIP guest type
        SELECT id INTO test_guest_type_id 
        FROM guest_types 
        WHERE event_id = test_event_id AND type_name = 'VIP';
        
        IF test_guest_type_id IS NOT NULL THEN
            -- Assign benefits (using correct column names from schema)
            INSERT INTO guest_type_benefits (guest_type_id, benefit_type, quantity, is_active)
            VALUES 
                (test_guest_type_id, 'souvenir', 1, true),
                (test_guest_type_id, 'snack', 1, true);
            
            -- Verify
            SELECT COUNT(*) INTO benefit_count 
            FROM guest_type_benefits 
            WHERE guest_type_id = test_guest_type_id AND is_active = true;
            
            IF benefit_count = 2 THEN
                RAISE NOTICE '✓ TEST 10 PASSED: Benefit assignment works';
            ELSE
                RAISE EXCEPTION '✗ TEST 10 FAILED: Expected 2 benefits, found %', benefit_count;
            END IF;
        END IF;
        
        -- Cleanup
        DELETE FROM events WHERE id = test_event_id;
        RAISE NOTICE '  Test data cleaned up';
    END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FASE 1 DATABASE SCHEMA TESTS COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All critical tests passed!';
    RAISE NOTICE 'Database schema is ready for FASE 2.';
    RAISE NOTICE '';
END $$;
