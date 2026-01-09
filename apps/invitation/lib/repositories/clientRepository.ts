import { getSupabaseClient, getSupabaseServiceClient } from '../supabaseClient';
import { encrypt, comparePassword } from '../services/encryption';

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
    slug: string | null;
    guestbook_access?: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateClientInput {
    username: string;
    password: string;
    email?: string;
    slug?: string;
}

export interface UpdateClientInput {
    username?: string;
    password?: string;
    email?: string;
    slug?: string;
}

/**
 * Find client by username
 */
export async function findClientByUsername(username: string): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    // Use .limit(1) instead of .single() to avoid Cloudflare 500 error
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('username', username)
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0] as Client;
}

/**
 * Verify client credentials
 */
export async function verifyClientCredentials(
    username: string,
    password: string
): Promise<Client | null> {
    const client = await findClientByUsername(username);

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
export async function getAllClients(): Promise<Client[]> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return (data as Client[]) || [];
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Client;
}

/**
 * Create new client
 */
export async function createClient(input: CreateClientInput): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();
    const passwordEncrypted = encrypt(input.password);

    const { data, error } = await supabase
        .from('clients')
        .insert({
            username: input.username,
            password_encrypted: passwordEncrypted,
            email: input.email || null,
            slug: input.slug || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return null;
    }

    return data as Client;
}

/**
 * Update client
 */
export async function updateClient(
    id: string,
    input: UpdateClientInput
): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    const updateData: any = {};

    if (input.username !== undefined) updateData.username = input.username;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.slug !== undefined) updateData.slug = input.slug || null;
    if (input.password) {
        updateData.password_encrypted = encrypt(input.password);
    }

    const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        return null;
    }

    return data as Client;
}

/**
 * Delete client
 */
export async function deleteClient(id: string): Promise<boolean> {
    const supabase = getSupabaseServiceClient();

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting client:', error);
        return false;
    }

    return true;
}

/**
 * Get available slugs (slugs not assigned to any client)
 */
export async function getAvailableSlugs(): Promise<string[]> {
    const supabase = getSupabaseServiceClient();

    // Get all slugs from invitation_contents
    const { data: allSlugs, error: slugsError } = await supabase
        .from('invitation_contents')
        .select('slug');

    if (slugsError || !allSlugs) {
        console.error('Error fetching slugs:', slugsError);
        return [];
    }

    // Get all assigned slugs from clients
    const { data: assignedSlugs, error: clientsError } = await supabase
        .from('clients')
        .select('slug')
        .not('slug', 'is', null);

    if (clientsError) {
        console.error('Error fetching assigned slugs:', clientsError);
        return [];
    }

    const assigned = new Set((assignedSlugs || []).map((c: any) => c.slug));
    const available = allSlugs
        .map((s: any) => s.slug)
        .filter((slug: string) => !assigned.has(slug));

    return available;
}
