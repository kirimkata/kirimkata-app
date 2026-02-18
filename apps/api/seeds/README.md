# Database Seeds

This directory contains SQL seed files for populating the database with test data.

## Files

### `templates_addons.sql`
Seeds the database with sample templates and add-ons for testing the e-commerce flow.

**Contents:**
- 5 Templates (wedding, birthday, corporate)
- 7 Add-ons (guestbook, live streaming, photo gallery, etc.)

## How to Run

### Using psql command line:

```bash
# Local database
psql -h localhost -U postgres -d kirimkata -f seeds/templates_addons.sql

# Remote database with connection string
psql postgresql://user:password@host:port/database -f seeds/templates_addons.sql
```

### Using database GUI (pgAdmin, DBeaver, etc.):
1. Open the SQL file
2. Execute the contents against your database

## Verification

After running the seed file, verify the data:

```sql
-- Check templates
SELECT id, name, slug, category, base_price, is_active 
FROM templates 
WHERE is_active = true;

-- Check addons
SELECT id, name, slug, category, price, is_active 
FROM addons 
WHERE is_active = true;
```

You should see:
- 5 active templates
- 7 active add-ons

## Notes

- The seed file uses `ON CONFLICT (slug) DO NOTHING` to prevent duplicate entries
- Safe to run multiple times
- Preview images use placeholder URLs (replace with real images in production)
- Prices are in IDR (Indonesian Rupiah)
