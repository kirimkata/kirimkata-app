import { getSupabaseServiceClient } from '../supabase';
import { EventGuest } from '../types';

/**
 * Get all guests for an event
 */
export async function getEventGuests(eventId: string): Promise<EventGuest[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event guests:', error);
    return [];
  }

  return (data as EventGuest[]) || [];
}

/**
 * Get guest statistics for an event
 */
export async function getGuestStats(eventId: string) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching guest stats:', error);
    return {
      total_guests: 0,
      checked_in: 0,
      not_checked_in: 0,
      registered: 0,
      walkin: 0,
    };
  }

  const guests = data || [];
  
  return {
    total_guests: guests.length,
    checked_in: guests.filter((g: any) => g.is_checked_in).length,
    not_checked_in: guests.filter((g: any) => !g.is_checked_in).length,
    registered: guests.filter((g: any) => g.source === 'registered').length,
    walkin: guests.filter((g: any) => g.source === 'walkin').length,
  };
}

/**
 * Create new guest
 */
export async function createGuest(
  eventId: string,
  guestData: {
    guest_name: string;
    guest_phone?: string;
    guest_email?: string;
    guest_type_id?: string;
    source: 'registered' | 'walkin';
    max_companions?: number;
    notes?: string;
  }
): Promise<EventGuest | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_guests')
    .insert({
      event_id: eventId,
      guest_name: guestData.guest_name,
      guest_phone: guestData.guest_phone || null,
      guest_email: guestData.guest_email || null,
      guest_type_id: guestData.guest_type_id || null,
      source: guestData.source,
      max_companions: guestData.max_companions || 0,
      notes: guestData.notes || null,
      should_send_invitation: false,
      invitation_sent: false,
      is_checked_in: false,
      created_by: 'CLIENT',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating guest:', error);
    return null;
  }

  return data as EventGuest;
}

/**
 * Update guest
 */
export async function updateGuest(
  guestId: string,
  updates: Partial<EventGuest>
): Promise<EventGuest | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_guests')
    .update(updates)
    .eq('id', guestId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating guest:', error);
    return null;
  }

  return data as EventGuest;
}

/**
 * Delete guest
 */
export async function deleteGuest(guestId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase
    .from('event_guests')
    .delete()
    .eq('id', guestId);

  if (error) {
    console.error('Error deleting guest:', error);
    return false;
  }

  return true;
}
