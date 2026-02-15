import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { clients, invitationPages, guestbookEvents } from '../src/db/schema';
import { eq, isNull } from 'drizzle-orm';

dotenv.config({ path: '.dev.vars' });

if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL is missing in .dev.vars');
}

const client = postgres(process.env.DIRECT_URL);
const db = drizzle(client);

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Invitation Pages (Link to Clients via Slug)
    console.log('Migrating Invitation Pages...');
    const allClients = await db.select().from(clients);

    for (const c of allClients) {
        if (c.slug) {
            // Find invitation page with matching slug
            const invitation = await db.select().from(invitationPages).where(eq(invitationPages.slug, c.slug)).limit(1);

            if (invitation.length > 0) {
                console.log(`Linking client ${c.username} to invitation ${c.slug}`);
                await db.update(invitationPages)
                    .set({ clientId: c.id })
                    .where(eq(invitationPages.id, invitation[0].id));
            }
        }
    }

    // 2. Migrate Guestbook Events (Link to Invitation Pages via Client ID if possible, or strictly 1-on-1 logic)
    // Assumption: If a client has only 1 invitation and 1 event, link them.
    console.log('Migrating Guestbook Events...');
    const allInvitations = await db.select().from(invitationPages);

    for (const invitation of allInvitations) {
        if (invitation.clientId) {
            const events = await db.select().from(guestbookEvents).where(eq(guestbookEvents.clientId, invitation.clientId));

            if (events.length === 1) {
                // Strong assumption: If client has 1 invitation and 1 event, they are related.
                console.log(`Linking event ${events[0].id} to invitation ${invitation.slug}`);
                await db.update(guestbookEvents)
                    .set({ invitationId: invitation.id })
                    .where(eq(guestbookEvents.id, events[0].id));
            } else if (events.length > 1) {
                console.warn(`Client ${invitation.clientId} has multiple events. Skipping auto-link for invitation ${invitation.slug}. Manual intervention required.`);
            }
        }
    }

    console.log('Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
