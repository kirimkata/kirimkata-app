import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .dev.vars
dotenv.config({ path: ".dev.vars" });

if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL is missing in .dev.vars");
}

export default {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    driver: "pg",
    dbCredentials: {
        connectionString: process.env.DIRECT_URL,
    },
} satisfies Config;