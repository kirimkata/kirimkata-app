// Environment bindings for Cloudflare Workers
export interface Env {
    // Secrets (set via wrangler secret put)
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    ADMIN_SECRET?: string;

    // Database
    DATABASE_URL: string;
    DIRECT_URL?: string;

    // Email service (Resend)
    EMAIL_API_KEY: string;
    EMAIL_FROM: string;
    FRONTEND_URL: string;

    // Variables (from wrangler.toml)
    ENVIRONMENT: 'development' | 'production';

    // R2 Bucket binding
    MEDIA_BUCKET: R2Bucket;

    // R2 Public URL
    R2_PUBLIC_URL: string;
}

// JWT Payload Types
export type JWTPayloadType = 'CLIENT' | 'STAFF' | 'ADMIN';

export interface BaseJWTPayload {
    type: JWTPayloadType;
    iat?: number;
    exp?: number;
}

export interface ClientJWTPayload extends BaseJWTPayload {
    type: 'CLIENT';
    client_id: string;
    guestbook_access: boolean;
}

export interface StaffJWTPayload extends BaseJWTPayload {
    type: 'STAFF';
    staff_id: string;
    client_id: string;
    can_checkin: boolean;
    can_manage_guests: boolean;
}

export interface AdminJWTPayload extends BaseJWTPayload {
    type: 'ADMIN';
    admin_id: string;
}

export type JWTPayload = ClientJWTPayload | StaffJWTPayload | AdminJWTPayload;

// Database Types
export interface Guest {
    id: string;
    client_id: string;
    name: string;
    phone?: string;
    guest_type_id?: string;
    event_id?: string;
    seating_config_id?: string;
    sent?: boolean;
    created_at: string;
    updated_at: string;
}

export interface Event {
    id: string;
    client_id: string;
    name: string;
    description?: string;
    event_date: string;
    location?: string;
    created_at: string;
    updated_at: string;
}

export interface Checkin {
    id: string;
    guest_id: string;
    client_id: string;
    staff_id?: string;
    check_in_method: CheckinMethod;
    checked_in_at: string;
    device_info?: Record<string, any>;
    notes?: string;
}

export type CheckinMethod = 'QR_SCAN' | 'MANUAL_SEARCH';

export interface Client {
    id: string;
    slug: string;
    name?: string;
    email?: string;
    phone?: string;
    guestbook_access: boolean;
    created_at: string;
    updated_at: string;
}

export interface Staff {
    id: string;
    client_id: string;
    name: string;
    username: string;
    can_checkin: boolean;
    can_manage_guests: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Hono Context with custom env
export type { Context } from 'hono';

export interface AppVariables {
    jwtPayload: JWTPayload;
    clientId: string;
    staffId: string;
}

export interface AppEnv {
    Bindings: Env;
    Variables: AppVariables;
}
