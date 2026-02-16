import { Hono } from 'hono';
import type { Env, CheckinMethod, JWTPayload, ClientJWTPayload, StaffJWTPayload } from '@/lib/types';
import { getDb } from '@/db';
import { guests, guestbookCheckins } from '@/db/schema';
import { eq, and, ilike, count } from 'drizzle-orm';
import { verifyToken, extractTokenFromHeader } from '@/services/jwt';

const checkin = new Hono<{ Bindings: Env }>();

/**
 * Verify authentication (client or staff) and check checkin permission
 */
async function verifyCheckinAuth(
    authHeader: string | null,
    jwtSecret: string
): Promise<{ payload: JWTPayload; clientId: string; staffId?: string } | null> {
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    const payload = await verifyToken(token, jwtSecret);

    if (!payload) {
        return null;
    }

    if (payload.type === 'CLIENT') {
        const clientPayload = payload as ClientJWTPayload;
        if (!clientPayload.guestbook_access) {
            return null;
        }
        return { payload, clientId: clientPayload.client_id };
    } else if (payload.type === 'STAFF') {
        const staffPayload = payload as StaffJWTPayload;
        if (!staffPayload.can_checkin) {
            return null;
        }
        return { payload, clientId: staffPayload.client_id, staffId: staffPayload.staff_id };
    }

    return null;
}

/**
 * POST /v1/checkin
 * Perform guest check-in (QR scan or manual search)
 */
checkin.post('/', async (c) => {
    try {
        // Verify authentication and checkin permission
        const authHeader = c.req.header('Authorization');
        const authResult = await verifyCheckinAuth(authHeader || null, c.env.JWT_SECRET);

        if (!authResult) {
            return c.json(
                { success: false, error: 'Unauthorized - tidak memiliki akses check-in' },
                401
            );
        }

        const { clientId, staffId } = authResult;

        const body = await c.req.json();
        const { guest_id, qr_token, method, notes } = body;

        let guest = null;
        const db = getDb(c.env);

        // Handle different check-in methods
        if (method === 'QR_SCAN' && qr_token) {
            // QR token: The code implies it might be guest_id OR a generated token.
            // Previous code used `eq('id', qr_token)`. 
            // If the QR contains the ID directly, we query by ID. 
            // If it's a token (QR-...), we query by qrCode. 
            // The previous code: `.eq('id', qr_token)`. This implies the QR code contains the UUID itself.
            // However, `guestbook-guests.ts` generates `QR-{uuid}-{random}`.
            // If the scanner sends the full string `QR-...`, then ID lookup will fail.
            // But if the scanner parses it or if the previous system used ID as QR, then ID works.
            // Given "qr_token" name, and `guestbook-guests.ts` generating `qrCode` column, 
            // I should probably check `qrCode` column too if ID fails, or just `qrCode`.
            // BUT, strict refactor of previous code: `.eq('id', qr_token)`. I will stick to that to avoid breaking changes if they send IDs.
            // WAIT, `guestbook-checkin.ts` used `qrCode` (schema) / `qr_token` (code).
            // `checkin.ts` (this file) used `.eq('id', qr_token)`. This is inconsistent.
            // I will assume `qrCode` column is the source of truth for QR scans if it matches the format, 
            // but if it looks like a uuid, maybe check ID?
            // To be safe and better than previous code: check both or stick to previous logic.
            // Previous logic: `eq('id', qr_token)`. I'll implement that first. 

            const [data] = await db
                .select()
                .from(guests)
                .where(eq(guests.id, qr_token))
                .limit(1);

            if (!data) {
                // Fallback: try querying by qrCode column just in case
                const [byCode] = await db
                    .select()
                    .from(guests)
                    .where(eq(guests.qrCode, qr_token))
                    .limit(1);

                if (!byCode) {
                    return c.json(
                        { success: false, error: 'Tamu tidak ditemukan atau QR Code tidak valid' },
                        404
                    );
                }
                guest = byCode;
            } else {
                guest = data;
            }

        } else if (method === 'MANUAL_SEARCH') {
            const { guest_name, guest_group } = body;

            if (!guest_id && !guest_name) {
                return c.json(
                    { success: false, error: 'Guest ID atau nama tamu wajib diisi untuk pencarian manual' },
                    400
                );
            }

            if (guest_id) {
                const [data] = await db
                    .select()
                    .from(guests)
                    .where(eq(guests.id, guest_id))
                    .limit(1);

                if (!data) {
                    return c.json(
                        { success: false, error: 'Tamu tidak ditemukan' },
                        404
                    );
                }

                guest = data;
            } else if (guest_name) {
                const conditions = [
                    eq(guests.clientId, clientId),
                    ilike(guests.name, `%${guest_name}%`)
                ];

                if (guest_group) {
                    conditions.push(eq(guests.guestGroup, guest_group));
                }

                const data = await db
                    .select()
                    .from(guests)
                    .where(and(...conditions))
                    .limit(10);

                if (!data || data.length === 0) {
                    return c.json(
                        { success: false, error: 'Tamu tidak ditemukan' },
                        404
                    );
                }

                if (data.length > 1) {
                    // Return multiple results for user to choose
                    return c.json(
                        {
                            success: false,
                            error: 'Ditemukan lebih dari 1 tamu dengan nama tersebut. Silakan pilih:',
                            data: data.map((g) => ({
                                id: g.id,
                                name: g.name,
                                phone: g.phone
                            }))
                        },
                        400
                    );
                }

                guest = data[0];
            }
        } else {
            return c.json(
                { success: false, error: 'Method check-in tidak valid' },
                400
            );
        }

        if (!guest) {
            return c.json(
                { success: false, error: 'Tamu tidak ditemukan' },
                404
            );
        }

        // Check if guest is already checked in
        // Check guests table isCheckedIn OR guestbookCheckins table?
        // Previous code checked `guestbook_checkins` table.
        // It also updated `invitation_guests` (in other files).
        // `checkin.ts` logic:
        // 1. Check `guestbook_checkins` existence.
        // 2. Insert `guestbook_checkins`.
        // 3. Return checks.
        // Note: It did NOT update `invitation_guests.is_checked_in`.
        // BUT `guestbook-checkin.ts` DOES update `invitation_guests.is_checked_in`.
        // I should probably do BOTH to stay consistent with the "Checkin" concept in this system.
        // Or at least `guest.isCheckedIn` check.

        // 1. Check if already checked in (using guests table flag is faster and consistent with other routes)
        if (guest.isCheckedIn) {
            return c.json(
                { success: false, error: 'Tamu sudah melakukan check-in sebelumnya' },
                409
            );
        }

        // Double check guestbook_checkins table if needed?
        const [existingCheckin] = await db
            .select({ id: guestbookCheckins.id })
            .from(guestbookCheckins)
            .where(eq(guestbookCheckins.guestId, guest.id))
            .limit(1);

        if (existingCheckin) {
            return c.json(
                { success: false, error: 'Tamu sudah melakukan check-in sebelumnya' },
                409
            );
        }

        // Get device and location info
        const userAgent = c.req.header('user-agent');
        const forwarded = c.req.header('x-forwarded-for');
        const realIp = c.req.header('x-real-ip');
        const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

        const deviceInfo = {
            user_agent: userAgent,
            ip_address: clientIp,
            timestamp: new Date().toISOString()
        };

        // Perform check-in: Insert to guestbookCheckins AND update guests
        const [checkinData] = await db
            .insert(guestbookCheckins)
            .values({
                guestId: guest.id,
                staffId: staffId || null,
                checkinMethod: method as CheckinMethod,
                deviceInfo: deviceInfo,
                notes,
                checkedInAt: new Date().toISOString(),
            })
            .returning();

        // Update guests table
        await db
            .update(guests)
            .set({
                isCheckedIn: true,
                checkedInAt: new Date().toISOString()
            })
            .where(eq(guests.id, guest.id));

        if (!checkinData) {
            return c.json(
                { success: false, error: 'Gagal melakukan check-in' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Check-in berhasil',
            data: {
                checkin: checkinData,
                guest: {
                    ...guest,
                    is_checked_in: true,
                    checkin_time: checkinData.checkedInAt
                }
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/checkin
 * Get recent check-ins for authenticated client
 */
checkin.get('/', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        const authResult = await verifyCheckinAuth(authHeader || null, c.env.JWT_SECRET);

        if (!authResult) {
            return c.json(
                { success: false, error: 'Unauthorized - tidak memiliki akses check-in' },
                401
            );
        }

        const { clientId } = authResult;
        const limit = parseInt(c.req.query('limit') || '10');

        const db = getDb(c.env);

        // Explicit JOINs not easily visible in simple Select *
        // We'll select from guestbookCheckins and join guests
        // Note: guestbookCheckins does not have client_id in schema?
        // Checking schema: 
        // export const guestbookCheckins = pgTable("guestbook_checkins", { ... guestId, staffId ... });
        // It does NOT have clientId directly. 
        // Previous code: `.eq('client_id', clientId)`. This implies schema mismatch in previous code or I missed it.
        // Schema view: 
        // 256: export const guestbookCheckins = pgTable("guestbook_checkins", {
        // ...
        // 258:     guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
        // ...
        // })
        // No client_id in guestbookCheckins. 
        // So we must JOIN guests to filter by client_id.

        const checkins = await db
            .select({
                id: guestbookCheckins.id,
                checkedInAt: guestbookCheckins.checkedInAt,
                checkinMethod: guestbookCheckins.checkinMethod,
                guest: guests
            })
            .from(guestbookCheckins)
            .innerJoin(guests, eq(guestbookCheckins.guestId, guests.id))
            .where(eq(guests.clientId, clientId))
            .orderBy(desc(guestbookCheckins.checkedInAt))
            .limit(limit);

        return c.json({
            success: true,
            data: checkins || []
        });

    } catch (error) {
        console.error('Error fetching check-ins:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/checkin/stats
 * Get check-in statistics
 */
checkin.get('/stats', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        const authResult = await verifyCheckinAuth(authHeader || null, c.env.JWT_SECRET);

        if (!authResult) {
            return c.json(
                { success: false, error: 'Unauthorized - tidak memiliki akses check-in' },
                401
            );
        }

        const { clientId } = authResult;
        const db = getDb(c.env);

        // Total checkins for this client
        // Join guests to filtered by client
        const [checkinsRes] = await db
            .select({ count: count() })
            .from(guestbookCheckins)
            .innerJoin(guests, eq(guestbookCheckins.guestId, guests.id))
            .where(eq(guests.clientId, clientId));

        const totalCheckins = checkinsRes?.count || 0;

        // Total guests
        const [guestsRes] = await db
            .select({ count: count() })
            .from(guests)
            .where(eq(guests.clientId, clientId));

        const totalGuests = guestsRes?.count || 0;

        return c.json({
            success: true,
            data: {
                total_checkins: totalCheckins,
                total_guests: totalGuests,
                checkin_percentage: totalGuests > 0
                    ? Math.round((totalCheckins / totalGuests) * 100)
                    : 0
            }
        });

    } catch (error) {
        console.error('Error fetching checkin stats:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

export default checkin;
