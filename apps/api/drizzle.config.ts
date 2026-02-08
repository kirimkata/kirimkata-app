import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    driver: "pg",
    dbCredentials: {
        connectionString: "postgresql://postgres.uxzmzgffheldcuipfdes:Lentera123!!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    },
} satisfies Config;