
import { eq, desc, not, isNull, and, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { clients, invitationContents, invitationPages } from '../db/schema';
import { encrypt, comparePassword } from '../services-invitation/encryption';
import type { Env } from '../lib/types';

export interface CustomImages {
    background?: string;
    background_limasan?: string;
    pengantin?: string;
    pengantin_jawa?: string;
}

export interface Client {
    id: string;
    username: string;
    password_encrypted: string;
    email: string | null;
    guestbook_access?: boolean;
    created_at: string;
    updated_at: string;
    quota_photos?: number;
    quota_music?: number;
    quota_videos?: number;
}

export interface CreateClientInput {
    username: string;
    password: string;
    email?: string;
}

export interface UpdateClientInput {
    username?: string;
    password?: string;
    email?: string;
}

export class ClientRepository {
    private getDb(env: Env) {
        const client = postgres(env.DATABASE_URL);
        return drizzle(client);
    }

    private mapToClient(row: any): Client {
        return {
            id: row.id,
            username: row.username,
            password_encrypted: row.passwordEncrypted,
            email: row.email,
            guestbook_access: row.guestbookAccess,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
            quota_photos: row.quotaPhotos,
            quota_music: row.quotaMusic,
            quota_videos: row.quotaVideos,
        };
    }

    /**
     * Find client by username
     */
    async findClientByUsername(username: string, env: Env): Promise<Client | null> {
        const db = this.getDb(env);

        const result = await db.select()
            .from(clients)
            .where(eq(clients.username, username))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.mapToClient(result[0]);
    }

    /**
     * Verify client credentials
     */
    async verifyClientCredentials(
        username: string,
        password: string,
        env: Env
    ): Promise<Client | null> {
        const client = await this.findClientByUsername(username, env);

        if (!client) {
            return null;
        }

        const isValid = comparePassword(password, client.password_encrypted);

        if (!isValid) {
            return null;
        }

        return client;
    }

    /**
     * Get all clients
     */
    async getAllClients(env: Env): Promise<Client[]> {
        const db = this.getDb(env);

        const results = await db.select()
            .from(clients)
            .orderBy(desc(clients.createdAt));

        return results.map(this.mapToClient);
    }

    /**
     * Get client by ID
     */
    async getClientById(id: string, env: Env): Promise<Client | null> {
        const db = this.getDb(env);

        const result = await db.select()
            .from(clients)
            .where(eq(clients.id, id));

        if (result.length === 0) {
            return null;
        }

        return this.mapToClient(result[0]);
    }

    /**
     * Create new client
     */
    async createClient(input: CreateClientInput, env: Env): Promise<Client | null> {
        const db = this.getDb(env);
        const passwordEncrypted = encrypt(input.password);

        try {
            const [newClient] = await db.insert(clients).values({
                username: input.username,
                passwordEncrypted: passwordEncrypted,
                email: input.email || null,
            }).returning();

            return this.mapToClient(newClient);
        } catch (error) {
            console.error('Error creating client:', error);
            return null;
        }
    }

    /**
     * Update client
     */
    async updateClient(
        id: string,
        input: UpdateClientInput,
        env: Env
    ): Promise<Client | null> {
        const db = this.getDb(env);

        const updateData: any = {};

        if (input.username !== undefined) updateData.username = input.username;
        if (input.email !== undefined) updateData.email = input.email || null;
        if (input.password) {
            updateData.passwordEncrypted = encrypt(input.password);
        }

        updateData.updatedAt = new Date().toISOString();

        try {
            const [updatedClient] = await db.update(clients)
                .set(updateData)
                .where(eq(clients.id, id))
                .returning();

            return this.mapToClient(updatedClient);
        } catch (error) {
            console.error('Error updating client:', error);
            return null;
        }
    }

    /**
     * Delete client
     */
    async deleteClient(id: string, env: Env): Promise<boolean> {
        const db = this.getDb(env);

        try {
            await db.delete(clients).where(eq(clients.id, id));
            return true;
        } catch (error) {
            console.error('Error deleting client:', error);
            return false;
        }
    }

    /**
     * Get available slugs (slugs not assigned to any client)
     */
    async getAvailableSlugs(env: Env): Promise<string[]> {
        const db = this.getDb(env);

        try {
            // Get all slugs from invitation_contents
            const allSlugsResult = await db.select({ slug: invitationContents.slug }).from(invitationContents);

            // Get all assigned slugs from invitation_pages
            const assignedSlugsResult = await db.select({ slug: invitationPages.slug })
                .from(invitationPages)
                .where(isNotNull(invitationPages.slug));

            const assigned = new Set((assignedSlugsResult || []).map(c => c.slug).filter(Boolean) as string[]);

            const available = allSlugsResult
                .map(s => s.slug)
                .filter(slug => !assigned.has(slug));

            return available;
        } catch (error) {
            console.error('Error fetching available slugs:', error);
            return [];
        }
    }
}

export const clientRepository = new ClientRepository();
