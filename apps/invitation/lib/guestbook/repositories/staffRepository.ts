import { getSupabaseServiceClient } from '../supabase';
import { GuestbookStaff } from '../types';
import { hashPassword } from '../services/encryption';

/**
 * Get all staff for an event
 */
export async function getEventStaff(eventId: string): Promise<GuestbookStaff[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guestbook_staff')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event staff:', error);
    return [];
  }

  return (data as GuestbookStaff[]) || [];
}

/**
 * Create new staff for event
 */
export async function createStaff(
  eventId: string,
  username: string,
  password: string,
  fullName: string,
  phone: string | null,
  permissions: {
    can_checkin?: boolean;
    can_redeem_souvenir?: boolean;
    can_redeem_snack?: boolean;
    can_access_vip_lounge?: boolean;
  }
): Promise<GuestbookStaff | null> {
  const supabase = getSupabaseServiceClient();

  // Check for duplicate username in this event
  const { data: existing } = await supabase
    .from('guestbook_staff')
    .select('id')
    .eq('event_id', eventId)
    .eq('username', username)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('Username sudah digunakan');
  }

  const { data, error } = await supabase
    .from('guestbook_staff')
    .insert({
      event_id: eventId,
      username,
      password_encrypted: hashPassword(password),
      full_name: fullName,
      phone,
      can_checkin: permissions.can_checkin ?? false,
      can_redeem_souvenir: permissions.can_redeem_souvenir ?? false,
      can_redeem_snack: permissions.can_redeem_snack ?? false,
      can_access_vip_lounge: permissions.can_access_vip_lounge ?? false,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating staff:', error);
    return null;
  }

  return data as GuestbookStaff;
}

/**
 * Update staff
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
): Promise<GuestbookStaff | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('guestbook_staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating staff:', error);
    return null;
  }

  return data as GuestbookStaff;
}

/**
 * Delete staff
 */
export async function deleteStaff(staffId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase
    .from('guestbook_staff')
    .delete()
    .eq('id', staffId);

  if (error) {
    console.error('Error deleting staff:', error);
    return false;
  }

  return true;
}
