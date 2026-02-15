import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guestbookEvents, guests, eventSeatingConfig } from '@/db/schema';
import { eq, and, desc, asc, count, isNotNull } from 'drizzle-orm';

const exportRoutes = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

/**
 * GET /v1/guestbook/export/guests?event_id=xxx
 * Export guests to CSV format
 * Requires client authentication
 */
exportRoutes.get('/guests', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify event belongs to client
        const [event] = await db
            .select({
                id: guestbookEvents.id,
                clientId: guestbookEvents.clientId,
                name: guestbookEvents.eventName
            })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Fetch all guests for this event
        const guestData = await db
            .select({
                id: guests.id,
                guest_name: guests.name,
                guest_phone: guests.phone,
                guest_email: guests.email,
                guest_group: guests.guestGroup,
                max_companions: guests.maxCompanions,
                actual_companions: guests.actualCompanions,
                is_checked_in: guests.isCheckedIn,
                checked_in_at: guests.checkedInAt,
                invitation_sent: guests.sent,
                qr_token: guests.qrCode,
                source: guests.source,
                created_at: guests.createdAt
            })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.clientId, clientId)
            ))
            .orderBy(asc(guests.createdAt));

        // Generate CSV content
        const headers = [
            'ID',
            'Name',
            'Phone',
            'Email',
            'Group',
            'Max Companions',
            'Actual Companions',
            'Checked In',
            'Checked In At',
            'Invitation Sent',
            'Has QR Code',
            'Source',
            'Created At'
        ];

        const csvRows = [headers.join(',')];

        for (const guest of guestData) {
            const row = [
                guest.id,
                `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_email || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_group || '').replace(/"/g, '""')}"`,
                guest.max_companions || 0,
                guest.actual_companions || 0,
                guest.is_checked_in ? 'Yes' : 'No',
                guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('en-US') : '',
                guest.invitation_sent ? 'Yes' : 'No',
                guest.qr_token ? 'Yes' : 'No',
                `"${(guest.source || '').replace(/"/g, '""')}"`,
                guest.created_at ? new Date(guest.created_at).toLocaleString('en-US') : ''
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        const filename = `guests_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error in export guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/export/report?event_id=xxx&type=overview|checkin|seating
 * Export comprehensive report in CSV format
 * Requires client authentication
 */
exportRoutes.get('/report', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');
        const reportType = c.req.query('type') || 'overview';

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify event belongs to client
        const [event] = await db
            .select({
                id: guestbookEvents.id,
                clientId: guestbookEvents.clientId,
                name: guestbookEvents.eventName
            })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        let csvContent = '';
        let filename = '';

        if (reportType === 'overview' || reportType === 'checkin') {
            // Fetch guests with check-in data
            const guestData = await db
                .select({
                    guest_name: guests.name,
                    guest_phone: guests.phone,
                    guest_email: guests.email,
                    guest_group: guests.guestGroup,
                    max_companions: guests.maxCompanions,
                    actual_companions: guests.actualCompanions,
                    is_checked_in: guests.isCheckedIn,
                    checked_in_at: guests.checkedInAt,
                    created_at: guests.createdAt
                })
                .from(guests)
                .where(and(
                    eq(guests.eventId, eventId),
                    eq(guests.clientId, clientId)
                ))
                .orderBy(desc(guests.checkedInAt)); // nullsFirst/Last depends on DB, usually nulls last by default in desc

            const headers = [
                'Name',
                'Phone',
                'Email',
                'Group',
                'Max Companions',
                'Actual Companions',
                'Checked In',
                'Checked In At',
                'Registered At'
            ];

            const csvRows = [headers.join(',')];

            for (const guest of guestData) {
                const row = [
                    `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_email || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_group || '').replace(/"/g, '""')}"`,
                    guest.max_companions || 0,
                    guest.actual_companions || 0,
                    guest.is_checked_in ? 'Yes' : 'No',
                    guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('en-US') : '',
                    guest.created_at ? new Date(guest.created_at).toLocaleString('en-US') : ''
                ];
                csvRows.push(row.join(','));
            }

            csvContent = csvRows.join('\n');
            filename = `report_${reportType}_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        } else if (reportType === 'seating') {
            // Fetch guests with seating information
            const guestData = await db
                .select({
                    guest_name: guests.name,
                    guest_phone: guests.phone,
                    max_companions: guests.maxCompanions,
                    actual_companions: guests.actualCompanions,
                    seating_config_id: guests.seatingConfigId,
                    is_checked_in: guests.isCheckedIn
                })
                .from(guests)
                .where(and(
                    eq(guests.eventId, eventId),
                    eq(guests.clientId, clientId)
                ))
                .orderBy(asc(guests.seatingConfigId));

            // Fetch seating configs
            const seatingConfigs = await db
                .select({
                    id: eventSeatingConfig.id,
                    name: eventSeatingConfig.name
                })
                .from(eventSeatingConfig)
                .where(eq(eventSeatingConfig.eventId, eventId));

            const seatingMap = new Map(
                seatingConfigs.map(s => [s.id, s.name]) // Use name directly as it format is controlled by UI/Backend
            );

            const headers = [
                'Name',
                'Phone',
                'Max Companions',
                'Actual Companions',
                'Seating Assignment',
                'Checked In'
            ];

            const csvRows = [headers.join(',')];

            for (const guest of guestData) {
                const seating = guest.seating_config_id
                    ? seatingMap.get(guest.seating_config_id) || 'Unknown'
                    : 'Not Assigned';

                const row = [
                    `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                    guest.max_companions || 0,
                    guest.actual_companions || 0,
                    `"${seating}"`,
                    guest.is_checked_in ? 'Yes' : 'No'
                ];
                csvRows.push(row.join(','));
            }

            csvContent = csvRows.join('\n');
            filename = `report_seating_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        } else {
            return c.json(
                { success: false, error: 'Invalid report type. Use: overview, checkin, or seating' },
                400
            );
        }

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error in export report:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/export/statistics?event_id=xxx
 * Export event statistics as JSON
 * Requires client authentication
 */
exportRoutes.get('/statistics', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify event belongs to client
        const [event] = await db
            .select({
                id: guestbookEvents.id,
                name: guestbookEvents.eventName,
                event_date: guestbookEvents.eventDate,
                location: guestbookEvents.venueName,
            })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get total guests
        const [totalGuestsResult] = await db
            .select({ count: count() })
            .from(guests)
            .where(eq(guests.eventId, eventId));
        const totalGuests = totalGuestsResult?.count || 0;

        // Get checked-in guests
        const [checkedInResult] = await db
            .select({ count: count() })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.isCheckedIn, true)
            ));
        const checkedInGuests = checkedInResult?.count || 0;

        // Get guests with QR codes
        const [qrResult] = await db
            .select({ count: count() })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                isNotNull(guests.qrCode)
            ));
        const guestsWithQR = qrResult?.count || 0;

        // Get guests with seating assigned
        const [seatingResult] = await db
            .select({ count: count() })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                isNotNull(guests.seatingConfigId)
            ));
        const guestsWithSeating = seatingResult?.count || 0;

        // Get total companions
        const companionData = await db
            .select({
                max_companions: guests.maxCompanions,
                actual_companions: guests.actualCompanions
            })
            .from(guests)
            .where(eq(guests.eventId, eventId));

        const maxCompanionsTotal = companionData.reduce((sum, g) => sum + (g.max_companions || 0), 0);
        const actualCompanionsTotal = companionData.reduce((sum, g) => sum + (g.actual_companions || 0), 0);

        const statistics = {
            event: {
                id: event.id,
                name: event.name,
                date: event.event_date,
                location: event.location,
            },
            guests: {
                total: totalGuests || 0,
                checked_in: checkedInGuests || 0,
                pending: (totalGuests || 0) - (checkedInGuests || 0),
                with_qr_code: guestsWithQR || 0,
                with_seating: guestsWithSeating || 0,
            },
            companions: {
                max_total: maxCompanionsTotal,
                actual_total: actualCompanionsTotal,
            },
            percentages: {
                check_in_rate: totalGuests ? ((checkedInGuests || 0) / totalGuests * 100).toFixed(2) : '0.00',
                qr_coverage: totalGuests ? ((guestsWithQR || 0) / totalGuests * 100).toFixed(2) : '0.00',
                seating_coverage: totalGuests ? ((guestsWithSeating || 0) / totalGuests * 100).toFixed(2) : '0.00',
            },
            generated_at: new Date().toISOString(),
        };

        return c.json({
            success: true,
            data: statistics,
        });
    } catch (error) {
        console.error('Error in export statistics:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default exportRoutes;

