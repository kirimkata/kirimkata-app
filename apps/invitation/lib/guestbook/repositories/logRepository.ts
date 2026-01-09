import { getSupabaseServiceClient } from '../supabase';

export type StaffAction = 'checkin' | 'souvenir' | 'snack' | 'meal' | 'vip_lounge' | 'other';

export interface StaffLog {
  id: string;
  staff_id: string;
  event_guest_id: string;
  action: StaffAction;
  notes?: string;
  created_at: string;
}

/**
 * Get checkin logs for an event
 */
export async function getCheckinLogs(eventId: string, limit: number = 20) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      event_guests!inner(
        id,
        event_id,
        guest_name,
        guest_phone,
        guest_type_id
      ),
      guestbook_staff(
        id,
        username,
        full_name
      )
    `)
    .eq('event_guests.event_id', eventId)
    .eq('action', 'checkin')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching checkin logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get redemption logs for an event
 */
export async function getRedemptionLogs(eventId: string, limit: number = 20) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      event_guests!inner(
        id,
        event_id,
        guest_name,
        guest_phone,
        guest_type_id
      ),
      guestbook_staff(
        id,
        username,
        full_name
      )
    `)
    .eq('event_guests.event_id', eventId)
    .in('action', ['souvenir', 'snack', 'meal'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching redemption logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Create staff log entry
 */
export async function createStaffLog(
  staffId: string,
  eventGuestId: string,
  action: StaffAction,
  notes?: string
): Promise<StaffLog | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('staff_logs')
    .insert({
      staff_id: staffId,
      event_guest_id: eventGuestId,
      action,
      notes: notes || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating staff log:', error);
    return null;
  }

  return data as StaffLog;
}

/**
 * Get all logs for an event
 */
export async function getEventLogs(eventId: string, limit: number = 50) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      event_guests!inner(
        id,
        event_id,
        guest_name,
        guest_phone
      ),
      guestbook_staff(
        id,
        username,
        full_name
      )
    `)
    .eq('event_guests.event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching event logs:', error);
    return [];
  }

  return data || [];
}
