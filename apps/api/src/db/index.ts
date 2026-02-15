import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Env } from '../lib/types';

// Cache the database connection in a global variable to prevent creating multiple connections
let _db: ReturnType<typeof createDb> | null = null;

export const createDb = (connectionString: string) => {
    // Disable prefetch/prepare for transaction pooler compatibility (Supabase port 6543)
    const client = postgres(connectionString, { prepare: false });
    return drizzle(client, { schema });
};

export const getDb = (env: Env) => {
    if (_db) {
        return _db;
    }

    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    _db = createDb(env.DATABASE_URL);
    return _db;
};

export type Db = ReturnType<typeof createDb>;
