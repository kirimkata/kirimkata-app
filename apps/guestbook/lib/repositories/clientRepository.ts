import { getSupabaseServiceClient } from '../supabase';
import { hashPassword, comparePassword } from '../services/encryption';
import { Client } from '../types';

/**
 * Find client by username
 */
export async function findClientByUsername(username: string): Promise<Client | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Client;
}

/**
 * Verify client credentials dan check guestbook access
 */
export async function verifyClientCredentials(
  username: string,
  password: string
): Promise<Client | null> {
  const client = await findClientByUsername(username);

  if (!client) {
    return null;
  }

  // Check if client has guestbook access (field may not exist in all schemas)
  if ((client as any).guestbook_access === false) {
    return null;
  }

  const isValid = comparePassword(password, client.password_encrypted);

  if (!isValid) {
    return null;
  }

  return client;
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
 * Enable guestbook access for client
 */
export async function enableGuestbookAccess(clientId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('clients')
    .update({ guestbook_access: true })
    .eq('id', clientId);

  if (error) {
    console.error('Error enabling guestbook access:', error);
    return false;
  }

  return true;
}

/**
 * Disable guestbook access for client
 */
export async function disableGuestbookAccess(clientId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('clients')
    .update({ guestbook_access: false })
    .eq('id', clientId);

  if (error) {
    console.error('Error disabling guestbook access:', error);
    return false;
  }

  return true;
}

/**
 * Get all clients with guestbook access
 */
export async function getClientsWithGuestbookAccess(): Promise<Client[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('guestbook_access', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return (data as Client[]) || [];
}
