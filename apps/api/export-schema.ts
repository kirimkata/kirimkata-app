
import postgres from 'postgres';
import fs from 'fs/promises';

const connectionString = "postgresql://postgres.uxzmzgffheldcuipfdes:Lentera123!!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const sql = postgres(connectionString);

async function exportSchema() {
    try {
        console.log("Fetching schema information...");

        // Get all columns from all tables in public schema
        const failedColumns = await sql`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `;

        // Group by table
        const schema: Record<string, any[]> = {};
        for (const col of failedColumns) {
            if (!schema[col.table_name]) {
                schema[col.table_name] = [];
            }
            schema[col.table_name].push({
                column: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable,
                default: col.column_default
            });
        }

        const outputPath = 'db_schema_dump.json';
        await fs.writeFile(outputPath, JSON.stringify(schema, null, 2));
        console.log(`Schema exported to ${outputPath}`);

    } catch (error) {
        console.error("Error exporting schema:", error);
    } finally {
        await sql.end();
    }
}

exportSchema();
