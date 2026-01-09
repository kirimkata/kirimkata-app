import { getSupabaseServiceClient } from '../supabase';
import { StaffLog, StaffAction } from '../types';

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
 * Get staff logs for a guest
 */
export async function getGuestStaffLogs(eventGuestId: string): Promise<StaffLog[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      staffs(name, staff_type)
    `)
    .eq('event_guest_id', eventGuestId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guest staff logs:', error);
    return [];
  }

  return (data as StaffLog[]) || [];
}

/**
 * Get staff logs for a staff member
 */
export async function getStaffLogs(staffId: string, limit: number = 50): Promise<StaffLog[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      event_guests(guest_name, guest_phone)
    `)
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching staff logs:', error);
    return [];
  }

  return (data as StaffLog[]) || [];
}

/**
 * Get recent staff logs for an event
 */
export async function getEventStaffLogs(eventId: string, limit: number = 20): Promise<StaffLog[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('staff_logs')
    .select(`
      *,
      staffs(name, staff_type),
      event_guests(guest_name, guest_phone)
    `)
    .eq('event_guests.event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching event staff logs:', error);
    return [];
  }

  return (data as StaffLog[]) || [];
}

/**
 * Get staff activity summary
 */
export async function getStaffActivitySummary(
  staffId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total_actions: number;
  actions_by_type: Record<StaffAction, number>;
  recent_logs: StaffLog[];
}> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('staff_logs')
    .select(`
      *,
      event_guests(guest_name, guest_phone)
    `)
    .eq('staff_id', staffId);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: logs, error } = await query
    .order('created_at', { ascending: false });

  if (error || !logs) {
    return {
      total_actions: 0,
      actions_by_type: {} as Record<StaffAction, number>,
      recent_logs: []
    };
  }

  const actionCounts: Record<StaffAction, number> = {
    checkin: 0,
    souvenir: 0,
    snack: 0,
    meal: 0,
    other: 0
  };

  logs.forEach((log: any) => {
    if (log.action in actionCounts) {
      actionCounts[log.action as StaffAction]++;
    }
  });

  return {
    total_actions: logs.length,
    actions_by_type: actionCounts,
    recent_logs: logs.slice(0, 10) as StaffLog[]
  };
}
