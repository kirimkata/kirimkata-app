import { Hono } from 'hono';
import type { Env, ClientJWTPayload, StaffJWTPayload, AdminJWTPayload } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
import { comparePassword } from '@/services/encryption';
import { generateToken } from '@/services/jwt';

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /v1/auth/client/login
 * Client login for invitation app
 */
auth.post('/client/login', async (c) => {
    try {
        const body = await c.req.json();
        const { username, password } = body;

        if (!username || !password) {
            return c.json(
                { success: false, error: 'Username and password are required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Find client by username
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (error || !clients || clients.length === 0) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        const client = clients[0];

        // Verify password
        const isValid = await comparePassword(
            password,
            client.password_encrypted,
            c.env.ENCRYPTION_KEY
        );

        if (!isValid) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Generate CLIENT JWT token
        const tokenPayload: ClientJWTPayload = {
            type: 'CLIENT',
            client_id: client.id,
            guestbook_access: client.guestbook_access ?? true,
        };

        const token = await generateToken(tokenPayload, c.env.JWT_SECRET);

        // Fetch theme_key from invitation_contents if client has a slug
        let theme_key = null;
        if (client.slug) {
            const { data: invitation } = await supabase
                .from('invitation_contents')
                .select('theme_key')
                .eq('slug', client.slug)
                .single();
            theme_key = invitation?.theme_key || null;
        }

        return c.json({
            success: true,
            token,
            client: {
                id: client.id,
                username: client.username,
                email: client.email,
                slug: client.slug,
                guestbook_access: client.guestbook_access ?? false,
                theme_key: theme_key,
            },
        });
    } catch (error) {
        console.error('Client login error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/auth/staff/login
 * Staff login for guestbook operator app
 */
auth.post('/staff/login', async (c) => {
    try {
        const body = await c.req.json();
        const { username, password } = body;

        if (!username || !password) {
            return c.json(
                { success: false, error: 'Username and password required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Find staff by username
        const { data: staff, error } = await supabase
            .from('guestbook_staff')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error || !staff) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Verify password
        const isValid = await comparePassword(
            password,
            staff.password_hash,
            c.env.ENCRYPTION_KEY
        );

        if (!isValid) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Generate STAFF JWT token
        const tokenPayload: StaffJWTPayload = {
            type: 'STAFF',
            staff_id: staff.id,
            client_id: staff.client_id,
            can_checkin: staff.can_checkin || true,
            can_manage_guests: staff.can_manage_guests || false,
        };

        const token = await generateToken(tokenPayload, c.env.JWT_SECRET);

        return c.json({
            success: true,
            token,
            staff: {
                id: staff.id,
                username: staff.username,
                full_name: staff.full_name,
                client_id: staff.client_id,
                permissions: {
                    can_checkin: staff.can_checkin,
                    can_manage_guests: staff.can_manage_guests,
                },
            },
        });
    } catch (error) {
        console.error('Staff login error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/auth/admin/login
 * Admin login for kirimkata admin dashboard
 */
auth.post('/admin/login', async (c) => {
    try {
        const body = await c.req.json();
        const { username, password } = body;

        if (!username || !password) {
            return c.json(
                { success: false, error: 'Username and password required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Find admin by username
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Verify password
        const isValid = await comparePassword(
            password,
            admin.password_encrypted,
            c.env.ENCRYPTION_KEY
        );

        if (!isValid) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Generate ADMIN JWT token
        const tokenPayload: AdminJWTPayload = {
            type: 'ADMIN',
            admin_id: admin.id,
        };

        const token = await generateToken(tokenPayload, c.env.JWT_SECRET);

        return c.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/auth/verify
 * Verify JWT token and return payload
 */
auth.post('/verify', async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;

        if (!token) {
            return c.json(
                { success: false, error: 'Token required' },
                400
            );
        }

        const { verifyToken } = await import('@/services/jwt');
        const payload = await verifyToken(token, c.env.JWT_SECRET);

        if (!payload) {
            return c.json(
                { success: false, error: 'Invalid token' },
                401
            );
        }

        return c.json({
            success: true,
            payload,
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default auth;
