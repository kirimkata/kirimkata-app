
import postgres from 'postgres';

const connectionString = "postgresql://postgres.uxzmzgffheldcuipfdes:Lentera123!!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const sql = postgres(connectionString);

async function checkSchema() {
    try {
        console.log("Checking 'clients' table columns...");
        const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'clients'
            ORDER BY column_name;
        `;

        if (columns.length === 0) {
            console.log("Table 'clients' not found!");
        } else {
            console.table(columns);

            const hasEmailVerified = columns.some(c => c.column_name === 'email_verified');
            console.log(`\nHas 'email_verified' column? ${hasEmailVerified ? 'YES ✅' : 'NO ❌'}`);
        }

        console.log("\nList of all tables in public schema:");
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;

        console.table(tables);

    } catch (error) {
        console.error("Error connecting to DB:", error);
    } finally {
        await sql.end();
    }
}

checkSchema();
