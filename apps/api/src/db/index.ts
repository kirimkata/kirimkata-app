import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Env } from '../lib/types';

// Cache removed to prevent "Cannot perform I/O on behalf of a different request" error in Cloudflare Workers
// With postgres.js in Workers, reusing the global connection across requests can sometimes cause context issues
// especially in dev environment.
// For now, we instantiate per request. Since we use connection pooling URL (Supabase Transaction Mode), 
// this is acceptable.

export const createDb = (connectionString: string) => {
    // Disable prefetch/prepare for transaction pooler compatibility (Supabase port 6543)
    const client = postgres(connectionString, {
        prepare: false,
        // max: 1, // Let it manage its own pool per instance
        // idle_timeout: 20, 
        // connect_timeout: 10,
    });
    return drizzle(client, { schema });
};

export const getDb = (env: Env) => {
    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    // Always create a fresh connection
    return createDb(env.DATABASE_URL);
};

export type Db = ReturnType<typeof createDb>;
