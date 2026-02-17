
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { admins } from '../db/schema';
import { encrypt, comparePassword } from '../services-invitation/encryption';
import type { Env } from '../lib/types';

export interface Admin {
    id: string;
    username: string;
    password_encrypted: string;
    email: string | null;
    created_at: string;
    updated_at: string;
}

export class AdminRepository {
    private getDb(env: Env) {
        const client = postgres(env.DATABASE_URL);
        return drizzle(client);
    }

    private mapToAdmin(row: any): Admin {
        return {
            id: row.id,
            username: row.username,
            password_encrypted: row.passwordEncrypted,
            email: row.email,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
        };
    }

    /**
     * Find admin by username
     */
    async findAdminByUsername(username: string, env: Env): Promise<Admin | null> {
        const db = this.getDb(env);

        const result = await db.select()
            .from(admins)
            .where(eq(admins.username, username))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return this.mapToAdmin(result[0]);
    }

    /**
     * Verify admin credentials
     */
    async verifyAdminCredentials(
        username: string,
        password: string,
        env: Env
    ): Promise<Admin | null> {
        const admin = await this.findAdminByUsername(username, env);

        if (!admin) {
            return null;
        }

        const isValid = comparePassword(password, admin.password_encrypted);

        if (!isValid) {
            return null;
        }

        return admin;
    }

    /**
     * Create new admin
     */
    async createAdmin(
        username: string,
        password: string,
        env: Env,
        email?: string
    ): Promise<Admin | null> {
        const db = this.getDb(env);
        const passwordEncrypted = encrypt(password);

        try {
            const [newAdmin] = await db.insert(admins).values({
                username,
                passwordEncrypted,
                email: email || null,
            }).returning();

            return this.mapToAdmin(newAdmin);
        } catch (error) {
            console.error('Error creating admin:', error);
            return null;
        }
    }

    /**
     * Update admin password
     */
    async updateAdminPassword(
        adminId: string,
        currentPassword: string,
        newPassword: string,
        env: Env
    ): Promise<{ success: boolean; error?: string }> {
        const db = this.getDb(env);

        // Get current admin data
        const result = await db.select()
            .from(admins)
            .where(eq(admins.id, adminId))
            .limit(1);

        if (result.length === 0) {
            return { success: false, error: 'Admin not found' };
        }

        const admin = this.mapToAdmin(result[0]);

        // Verify current password
        const isValid = comparePassword(currentPassword, admin.password_encrypted);
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Encrypt new password
        const newPasswordEncrypted = encrypt(newPassword);

        try {
            await db.update(admins)
                .set({
                    passwordEncrypted: newPasswordEncrypted,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(admins.id, adminId));

            return { success: true };
        } catch (error) {
            console.error('Error updating password:', error);
            return { success: false, error: 'Failed to update password' };
        }
    }
}

export const adminRepository = new AdminRepository();
