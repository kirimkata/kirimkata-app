import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const createDb = (connectionString: string) => {
    const client = postgres(connectionString, { prepare: false });
    return drizzle(client, { schema });
};

// Type helper
export type DbClient = ReturnType<typeof createDb>;
