import { Hono } from 'hono';
import type { Env, ClientJWTPayload, StaffJWTPayload, AdminJWTPayload } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
import { comparePassword, hashPassword, generateRandomString } from '@/services/encryption';
import { generateToken } from '@/services/jwt';
import { sendVerificationEmail } from '@/services/email';

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

        // Check if email is verified
        if (!client.email_verified) {
            return c.json(
                {
                    success: false,
                    error: 'Email not verified',
                    code: 'EMAIL_NOT_VERIFIED',
                    email: client.email
                },
                403
            );
        }

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
                is_published: client.is_published ?? false,
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
 * POST /v1/auth/client/register
 * Client registration with email verification
 */
auth.post('/client/register', async (c) => {
    try {
        const body = await c.req.json();
        const { username, email, password } = body;

        // Validation
        if (!username || !email || !password) {
            return c.json(
                { success: false, error: 'Username, email, and password are required' },
                400
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return c.json(
                { success: false, error: 'Invalid email format' },
                400
            );
        }

        // Validate password strength (min 8 characters)
        if (password.length < 8) {
            return c.json(
                { success: false, error: 'Password must be at least 8 characters' },
                400
            );
        }

        // Validate username (alphanumeric and underscore only, 3-20 chars)
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return c.json(
                { success: false, error: 'Username must be 3-20 characters (letters, numbers, underscore only)' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Check if username already exists
        const { data: existingUsername } = await supabase
            .from('clients')
            .select('id')
            .eq('username', username)
            .limit(1);

        if (existingUsername && existingUsername.length > 0) {
            return c.json(
                { success: false, error: 'Username already taken' },
                409
            );
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
            .from('clients')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (existingEmail && existingEmail.length > 0) {
            return c.json(
                { success: false, error: 'Email already registered' },
                409
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Generate email verification token
        const verificationToken = generateRandomString(32);
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours from now

        // Create client
        const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({
                username,
                email,
                password_encrypted: passwordHash,
                email_verified: false,
                email_verification_token: verificationToken,
                email_verification_token_expires_at: tokenExpiry.toISOString(),
                is_published: false,
                payment_status: 'pending',
                guestbook_access: false,
            })
            .select()
            .single();

        if (createError || !newClient) {
            console.error('Error creating client:', createError);
            return c.json(
                { success: false, error: 'Failed to create account' },
                500
            );
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(
            {
                email,
                username,
                token: verificationToken,
            },
            c.env.EMAIL_API_KEY,
            c.env.EMAIL_FROM,
            c.env.FRONTEND_URL
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail registration, but log the error
        }

        return c.json({
            success: true,
            message: 'Account created successfully. Please check your email to verify your account.',
            client: {
                id: newClient.id,
                username: newClient.username,
                email: newClient.email,
            },
        });
    } catch (error) {
        console.error('Client registration error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/auth/verify-email
 * Verify email using token from email
 */
auth.post('/verify-email', async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;

        if (!token) {
            return c.json(
                { success: false, error: 'Verification token required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Find client by verification token
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('email_verification_token', token)
            .limit(1);

        if (error || !clients || clients.length === 0) {
            return c.json(
                { success: false, error: 'Invalid verification token' },
                400
            );
        }

        const client = clients[0];

        // Check if already verified
        if (client.email_verified) {
            return c.json({
                success: true,
                message: 'Email already verified',
            });
        }

        // Check if token expired
        const expiryDate = new Date(client.email_verification_token_expires_at);
        if (expiryDate < new Date()) {
            return c.json(
                { success: false, error: 'Verification token expired', code: 'TOKEN_EXPIRED' },
                400
            );
        }

        // Update client to verified
        const { error: updateError } = await supabase
            .from('clients')
            .update({
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                email_verification_token: null,
                email_verification_token_expires_at: null,
            })
            .eq('id', client.id);

        if (updateError) {
            console.error('Error verifying email:', updateError);
            return c.json(
                { success: false, error: 'Failed to verify email' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Email verified successfully. You can now login.',
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/auth/resend-verification
 * Resend verification email
 */
auth.post('/resend-verification', async (c) => {
    try {
        const body = await c.req.json();
        const { email } = body;

        if (!email) {
            return c.json(
                { success: false, error: 'Email required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Find client by email
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error || !clients || clients.length === 0) {
            // Don't reveal if email exists or not for security
            return c.json({
                success: true,
                message: 'If the email exists, a verification link has been sent.',
            });
        }

        const client = clients[0];

        // Check if already verified
        if (client.email_verified) {
            return c.json(
                { success: false, error: 'Email already verified' },
                400
            );
        }

        // Generate new verification token
        const verificationToken = generateRandomString(32);
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        // Update client with new token
        const { error: updateError } = await supabase
            .from('clients')
            .update({
                email_verification_token: verificationToken,
                email_verification_token_expires_at: tokenExpiry.toISOString(),
            })
            .eq('id', client.id);

        if (updateError) {
            console.error('Error updating verification token:', updateError);
            return c.json(
                { success: false, error: 'Failed to resend verification email' },
                500
            );
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(
            {
                email: client.email,
                username: client.username,
                token: verificationToken,
            },
            c.env.EMAIL_API_KEY,
            c.env.EMAIL_FROM,
            c.env.FRONTEND_URL
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return c.json(
                { success: false, error: 'Failed to send verification email' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Verification email sent. Please check your inbox.',
        });
    } catch (error) {
        console.error('Resend verification error:', error);
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
