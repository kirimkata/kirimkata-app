import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guests, guestbookCheckins } from '@/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

const guestsRouter = new Hono<{ Bindings: Env; Variables: { clientId: string } }>();

// All guests routes require client authentication
guestsRouter.use('*', clientAuthMiddleware);

/**
 * GET /v1/guests
 * Get all guests for authenticated client
 */
guestsRouter.get('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const db = getDb(c.env);

        const guestsList = await db
            .select({
                id: guests.id,
                name: guests.name,
                phone: guests.phone,
                sent: guests.sent
            })
            .from(guests)
            .where(eq(guests.clientId, clientId))
            .orderBy(asc(guests.createdAt));

        return c.json({
            success: true,
            guests: guestsList || [],
        });
    } catch (error) {
        console.error('Error in GET /v1/guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guests
 * Create or replace all guests for client
 */
guestsRouter.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guests: guestsData } = body;

        if (!Array.isArray(guestsData)) {
            return c.json(
                { success: false, error: 'Invalid guests data' },
                400
            );
        }

        const db = getDb(c.env);

        // Transaction: Delete all existing guests for this client, then insert new ones
        await db.transaction(async (tx) => {
            // Delete existing
            await tx
                .delete(guests)
                .where(eq(guests.clientId, clientId));

            // Insert new guests if any
            if (guestsData.length > 0) {
                const guestsToInsert = guestsData.map((guest: any) => ({
                    clientId: clientId,
                    name: guest.name,
                    phone: guest.phone,
                    sent: guest.sent || false,
                }));

                // Chunk inserts if too many? Drizzle usually handles reasonable batch sizes.
                // Assuming normal usage (< 1000 guests).
                await tx
                    .insert(guests)
                    .values(guestsToInsert);
            }
        });

        // Fetch inserted guests to return
        // (Transaction successful implies insert successful)
        const insertedGuests = await db
            .select({
                id: guests.id,
                name: guests.name,
                phone: guests.phone,
                sent: guests.sent
            })
            .from(guests)
            .where(eq(guests.clientId, clientId))
            .orderBy(asc(guests.createdAt));

        if (guestsData.length > 0) {
            return c.json({
                success: true,
                message: 'Guests saved successfully',
                guests: insertedGuests || [],
            });
        }

        return c.json({
            success: true,
            message: 'All guests deleted successfully',
            guests: [],
        });

    } catch (error) {
        console.error('Error in POST /v1/guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guests/stats
 * Get guest statistics for client
 */
guestsRouter.get('/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const db = getDb(c.env);

        // Total Guests
        const [totalGuestsRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(eq(guests.clientId, clientId));
        const totalGuests = Number(totalGuestsRes?.count || 0);

        // Checked In Guests (Need to join or count distinct guestIds in checkins?)
        // guestbook-checkin.ts logic: check guests.isCheckedIn
        // guests.ts logic: check count in guestbookCheckins table by clientId?
        // But `guestbookCheckins` does not have `clientId` directly (as per my previous discovery), 
        // it links to `guests`.
        // So checking `guestbookCheckins` requires join with `guests` where `guests.clientId = ...`.

        // Alternatively, use `guests.isCheckedIn` if that is reliable.
        // Given that `guestbook-checkin.ts` updates `guests.isCheckedIn`, it should be reliable.
        // However, the original `guests.ts` code queried `guestbook_checkins` table (which it assumed had `client_id`).
        // Wait, did `guestbook_checkins` have `client_id` in schema?
        // Let's re-verify schema.ts line 256.
        // `export const guestbookCheckins = pgTable("guestbook_checkins", { ... guestId, staffId ... })`
        // NO client_id.
        // So original code `eq('client_id', clientId)` was probably wrong or relied on triggers/views I don't see, 
        // OR I missed a column.
        // Checking `schema.ts`:
        // 256: export const guestbookCheckins = pgTable("guestbook_checkins", {
        // 257:     id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
        // 258:     guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
        // 259:     staffId: uuid("staff_id").references(() => guestbookStaff.id, { onDelete: "set null" }),
        // ...
        // No client_id.

        // So querying `guestbookCheckins` for stats by client requires join.
        // Or simply `guests.isCheckedIn`. strict `checkin` usually implies present time check-in, 
        // maybe `guests.isCheckedIn` is the flag for "has checked in".
        // I'll use `guests.isCheckedIn` for consistency with `guestbook-checkin.ts`.

        const [checkedInRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(and(
                eq(guests.clientId, clientId),
                eq(guests.isCheckedIn, true)
            ));
        const checkedInGuests = Number(checkedInRes?.count || 0);

        return c.json({
            success: true,
            data: {
                total_guests: totalGuests,
                checked_in_guests: checkedInGuests,
            },
        });
    } catch (error) {
        console.error('Error fetching guest stats:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestsRouter;
