import { getSupabaseClient, getSupabaseServiceClient } from '../supabaseClient';
import { encrypt, comparePassword } from '../services/encryption';

export interface Admin {
    id: string;
    username: string;
    password_encrypted: string;
    email: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Find admin by username
 */
export async function findAdminByUsername(username: string): Promise<Admin | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Admin;
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(
    username: string,
    password: string
): Promise<Admin | null> {
    const admin = await findAdminByUsername(username);

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
export async function createAdmin(
    username: string,
    password: string,
    email?: string
): Promise<Admin | null> {
    const supabase = getSupabaseServiceClient();
    const passwordEncrypted = encrypt(password);

    const { data, error } = await supabase
        .from('admins')
        .insert({
            username,
            password_encrypted: passwordEncrypted,
            email: email || null,
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error creating admin:', error);
        return null;
    }

    return data as Admin;
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseServiceClient();

    // Get current admin data
    const { data: admin, error: fetchError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();

    if (fetchError || !admin) {
        return { success: false, error: 'Admin not found' };
    }

    // Verify current password
    const isValid = comparePassword(currentPassword, admin.password_encrypted);
    if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
    }

    // Encrypt new password
    const newPasswordEncrypted = encrypt(newPassword);

    // Update password
    const { error: updateError } = await supabase
        .from('admins')
        .update({
            password_encrypted: newPasswordEncrypted,
            updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

    if (updateError) {
        console.error('Error updating password:', updateError);
        return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
}
