import { Hono } from 'hono';
import type { Env, CheckinMethod, JWTPayload, ClientJWTPayload, StaffJWTPayload } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
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
        const supabase = getSupabaseClient(c.env);

        // Handle different check-in methods
        if (method === 'QR_SCAN' && qr_token) {
            // QR token is just the guest ID - direct lookup
            const { data, error } = await supabase
                .from('invitation_guests')
                .select('*')
                .eq('id', qr_token)
                .limit(1)
                .single();

            if (error || !data) {
                return c.json(
                    { success: false, error: 'Tamu tidak ditemukan atau QR Code tidak valid' },
                    404
                );
            }

            guest = data;
        } else if (method === 'MANUAL_SEARCH') {
            const { guest_name, guest_group } = body;

            if (!guest_id && !guest_name) {
                return c.json(
                    { success: false, error: 'Guest ID atau nama tamu wajib diisi untuk pencarian manual' },
                    400
                );
            }

            if (guest_id) {
                const { data, error } = await supabase
                    .from('invitation_guests')
                    .select('*')
                    .eq('id', guest_id)
                    .single();

                if (error || !data) {
                    return c.json(
                        { success: false, error: 'Tamu tidak ditemukan' },
                        404
                    );
                }

                guest = data;
            } else if (guest_name) {
                let query = supabase
                    .from('invitation_guests')
                    .select('*')
                    .eq('client_id', clientId)
                    .ilike('name', `%${guest_name}%`);

                if (guest_group) {
                    query = query.eq('guest_group', guest_group);
                }

                const { data, error } = await query.limit(10);

                if (error || !data) {
                    return c.json(
                        { success: false, error: 'Tamu tidak ditemukan' },
                        404
                    );
                }

                if (data.length === 0) {
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
        const { data: existingCheckin } = await supabase
            .from('guestbook_checkins')
            .select('id')
            .eq('guest_id', guest.id)
            .limit(1);

        if (existingCheckin && existingCheckin.length > 0) {
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

        // Perform check-in
        const { data: checkinData, error: checkinError } = await supabase
            .from('guestbook_checkins')
            .insert({
                guest_id: guest.id,
                client_id: clientId,
                staff_id: staffId || null,
                check_in_method: method as CheckinMethod,
                device_info: deviceInfo,
                notes
            })
            .select()
            .single();

        if (checkinError) {
            console.error('Check-in error:', checkinError);
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
                    checkin_time: checkinData.checked_in_at
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

        const supabase = getSupabaseClient(c.env);

        const { data: checkins, error } = await supabase
            .from('guestbook_checkins')
            .select(`
        *,
        invitation_guests:guest_id(*),
        guestbook_staff:staff_id(*)
      `)
            .eq('client_id', clientId)
            .order('checked_in_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching check-ins:', error);
            return c.json(
                { success: false, error: 'Gagal mengambil data check-in' },
                500
            );
        }

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
        const supabase = getSupabaseClient(c.env);

        const { count: totalCheckins = 0 } = await supabase
            .from('guestbook_checkins')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId);

        const { count: totalGuests = 0 } = await supabase
            .from('invitation_guests')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId);

        return c.json({
            success: true,
            data: {
                total_checkins: totalCheckins ?? 0,
                total_guests: totalGuests ?? 0,
                checkin_percentage: totalGuests > 0
                    ? Math.round((totalCheckins ?? 0) / totalGuests * 100)
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
