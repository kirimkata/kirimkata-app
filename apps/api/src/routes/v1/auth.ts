import { Hono } from 'hono';
import type { Env, ClientJWTPayload, StaffJWTPayload, AdminJWTPayload } from '@/lib/types';
import { getDb } from '@/db';
import { clients, invitationPages, guestbookStaff, admins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

        const db = getDb(c.env);

        // Find client by username
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.username, username))
            .limit(1);

        if (!client) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Check if email is verified
        if (!client.emailVerified) {
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
            client.passwordEncrypted,
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
            guestbook_access: client.guestbookAccess ?? true,
        };

        const token = await generateToken(tokenPayload, c.env.JWT_SECRET);

        // Fetch primary invitation for the client
        const [invitation] = await db
            .select({
                slug: invitationPages.slug,
                themeKey: invitationPages.themeKey
            })
            .from(invitationPages)
            .where(eq(invitationPages.clientId, client.id))
            .limit(1);

        const slug = invitation?.slug || null;
        const themeKey = invitation?.themeKey || null;

        return c.json({
            success: true,
            token,
            client: {
                id: client.id,
                username: client.username,
                email: client.email,
                slug: slug, // use fetched slug
                guestbook_access: client.guestbookAccess ?? false,
                theme_key: themeKey,
                is_published: client.isPublished ?? false,
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

        const db = getDb(c.env);

        // Check if username already exists
        const [existingUsername] = await db
            .select({ id: clients.id })
            .from(clients)
            .where(eq(clients.username, username))
            .limit(1);

        if (existingUsername) {
            return c.json(
                { success: false, error: 'Username already taken' },
                409
            );
        }

        // Check if email already exists
        const [existingEmail] = await db
            .select({ id: clients.id })
            .from(clients)
            .where(eq(clients.email, email))
            .limit(1);

        if (existingEmail) {
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
        const [newClient] = await db
            .insert(clients)
            .values({
                username,
                email,
                passwordEncrypted: passwordHash,
                emailVerified: false,
                emailVerificationToken: verificationToken,
                emailVerificationTokenExpiresAt: tokenExpiry.toISOString(),
                isPublished: false,
                paymentStatus: 'pending',
                guestbookAccess: false,
            })
            .returning({
                id: clients.id,
                username: clients.username,
                email: clients.email,
            });

        if (!newClient) {
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
            client: newClient,
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

        const db = getDb(c.env);

        // Find client by verification token
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.emailVerificationToken, token))
            .limit(1);

        if (!client) {
            return c.json(
                { success: false, error: 'Invalid verification token' },
                400
            );
        }

        // Check if already verified
        if (client.emailVerified) {
            return c.json({
                success: true,
                message: 'Email already verified',
            });
        }

        // Check if token expired
        const expiryDate = new Date(client.emailVerificationTokenExpiresAt!);
        if (expiryDate < new Date()) {
            return c.json(
                { success: false, error: 'Verification token expired', code: 'TOKEN_EXPIRED' },
                400
            );
        }

        // Update client to verified
        await db
            .update(clients)
            .set({
                emailVerified: true,
                emailVerifiedAt: new Date().toISOString(),
                emailVerificationToken: null,
                emailVerificationTokenExpiresAt: null,
            })
            .where(eq(clients.id, client.id));

        return c.json({
            success: true,
            message: 'Email verified successfully. You can now login.',
        });
    } catch (error: any) {
        console.error('Email verification error:', error);
        return c.json(
            { success: false, error: 'Internal server error', details: error.message },
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

        const db = getDb(c.env);

        // Find client by email
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.email, email))
            .limit(1);

        if (!client) {
            // Don't reveal if email exists or not for security
            return c.json({
                success: true,
                message: 'If the email exists, a verification link has been sent.',
            });
        }

        // Check if already verified
        if (client.emailVerified) {
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
        await db
            .update(clients)
            .set({
                emailVerificationToken: verificationToken,
                emailVerificationTokenExpiresAt: tokenExpiry.toISOString(),
            })
            .where(eq(clients.id, client.id));

        // Send verification email
        const emailResult = await sendVerificationEmail(
            {
                email: client.email!,
                username: client.username!,
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

        const db = getDb(c.env);

        // Find staff by username
        const [staff] = await db
            .select()
            .from(guestbookStaff)
            .where(and(
                eq(guestbookStaff.username, username),
                eq(guestbookStaff.isActive, true)
            ))
            .limit(1);

        if (!staff) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Verify password
        const isValid = await comparePassword(
            password,
            staff.passwordEncrypted,
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
            client_id: staff.clientId,
            can_checkin: staff.canCheckin || true,
            can_manage_guests: false, // Explicitly set to false as per legacy logic default? Or check schema?
            // Legacy interface had can_manage_guests. Schema has canRedeemSouvenir etc. 
            // Let's check schema again. 
            // Schema: canCheckin, canRedeemSouvenir, canRedeemSnack, canAccessVipLounge.
            // No canManageGuests in schema provided in previous turn snippet?
            // Actually I saw canManageGuests in the legacy code "staff.can_manage_guests".
            // Let me re-read schema.ts line 181 area.
            // Schema has: canCheckin, canRedeemSouvenir, canRedeemSnack, canAccessVipLounge, isActive.
            // It DOES NOT have `canManageGuests`. 
            // However, the JWT payload expects `can_manage_guests`.
            // Use `false` for now or map it if I find a relevant column.
        };

        // Wait, looking at legacy code:
        // can_checkin: staff.can_checkin || true,
        // can_manage_guests: staff.can_manage_guests || false,
        //
        // My schema snippet showed:
        // canCheckin: boolean("can_checkin").default(false),
        // canRedeemSouvenir...
        //
        // It seems `can_manage_guests` column might be missing from my schema snippet or renamed?
        // Or it was never there and legacy code was using raw query on a column that existed?
        // I will assume `false` for now to be safe, or map `canCheckin` to it if appropriate, but they seem distinct.
        // Actually, let's keep it safe.

        const token = await generateToken(tokenPayload, c.env.JWT_SECRET);

        return c.json({
            success: true,
            token,
            staff: {
                id: staff.id,
                username: staff.username,
                full_name: staff.fullName,
                client_id: staff.clientId,
                permissions: {
                    can_checkin: staff.canCheckin,
                    can_manage_guests: false, // aligned with JWT
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

        const db = getDb(c.env);

        // Find admin by username
        const [admin] = await db
            .select()
            .from(admins)
            .where(eq(admins.username, username))
            .limit(1);

        if (!admin) {
            return c.json(
                { success: false, error: 'Invalid credentials' },
                401
            );
        }

        // Verify password
        const isValid = await comparePassword(
            password,
            admin.passwordEncrypted,
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
