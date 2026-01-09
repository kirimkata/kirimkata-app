import { getSupabaseServiceClient } from '../supabase';
import { Staff } from '../types';
import { hashPassword } from '../services/encryption';

const STAFF_TABLE = 'guestbook_staff';

/**
 * Ambil semua staff milik client
 */
export async function getClientStaff(clientId: string): Promise<Staff[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(STAFF_TABLE)
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client staff:', error);
    return [];
  }
  return (data as Staff[]) || [];
}

/**
 * Buat staff baru untuk client
 */
export async function createStaff(
  clientId: string,
  username: string,
  password: string,
  full_name: string,
  phone: string | null,
  permissions: {
    can_checkin?: boolean;
    can_redeem_souvenir?: boolean;
    can_redeem_snack?: boolean;
    can_access_vip_lounge?: boolean;
  },
  created_by: 'CLIENT' | 'ADMIN_KIRIMKATA'
): Promise<Staff | null> {
  const supabase = getSupabaseServiceClient();

  // Periksa duplikat username per client
  const { data: existing } = await supabase
    .from(STAFF_TABLE)
    .select('id')
    .eq('client_id', clientId)
    .eq('username', username)
    .limit(1);
  if (existing && existing.length > 0) {
    throw new Error('Username sudah digunakan');
  }

  const { data, error } = await supabase
    .from(STAFF_TABLE)
    .insert({
      client_id: clientId,
      username,
      password_encrypted: hashPassword(password),
      full_name,
      phone,
      can_checkin: permissions.can_checkin ?? false,
      can_redeem_souvenir: permissions.can_redeem_souvenir ?? false,
      can_redeem_snack: permissions.can_redeem_snack ?? false,
      can_access_vip_lounge: permissions.can_access_vip_lounge ?? false,
      created_by,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating staff:', error);
    return null;
  }

  return data as Staff;
}

/**
 * Update data staff
 */
export async function updateStaff(
  staffId: string,
  updates: Partial<{
    full_name: string;
    phone: string | null;
    can_checkin: boolean;
    can_redeem_souvenir: boolean;
    can_redeem_snack: boolean;
    can_access_vip_lounge: boolean;
    is_active: boolean;
  }>
): Promise<Staff | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from(STAFF_TABLE)
    .update(updates)
    .eq('id', staffId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating staff:', error);
    return null;
  }

  return data as Staff;
}

/**
 * Hapus staff
 */
export async function deleteStaff(staffId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from(STAFF_TABLE)
    .delete()
    .eq('id', staffId);

  if (error) {
    console.error('Error deleting staff:', error);
    return false;
  }
  return true;
}

/**
 * Verifikasi staff dengan PIN (untuk login staff)
 * Digunakan oleh staff auth endpoint
 */
export async function verifyStaffPin(
  eventId: string,
  pinCode: string
): Promise<Staff | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('event_id', eventId)
    .eq('pin_code', pinCode)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Staff;
}

/**
 * Get staff by ID
 */
export async function getStaffById(staffId: string): Promise<Staff | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from(STAFF_TABLE)
    .select('*')
    .eq('id', staffId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Staff;
}
