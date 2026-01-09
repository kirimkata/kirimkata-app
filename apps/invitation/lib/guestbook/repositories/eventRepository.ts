import { getSupabaseServiceClient } from '../supabase';
import { Event } from '../types';

/**
 * Get all events for a client
 */
export async function getClientEvents(clientId: string): Promise<Event[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('client_id', clientId)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching client events:', error);
    return [];
  }

  return (data as Event[]) || [];
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Event;
}

/**
 * Create new event
 */
export async function createEvent(
  clientId: string,
  name: string,
  eventDate?: string,
  location?: string,
  options?: {
    event_time?: string;
    venue_address?: string;
  }
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();

  const insertData: any = {
    client_id: clientId,
    event_name: name,
    event_date: eventDate,
    venue_name: location,
    is_active: true,
    staff_quota: 2,
    staff_quota_used: 0
  };

  // Add optional fields if provided
  if (options?.event_time) insertData.event_time = options.event_time;
  if (options?.venue_address) insertData.venue_address = options.venue_address;

  const { data, error } = await supabase
    .from('events')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating event:', error);
    return null;
  }

  return data as Event;
}

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'client_id' | 'created_at' | 'updated_at'>>
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating event:', error);
    return null;
  }

  return data as Event;
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }

  return true;
}

/**
 * Create event with module configuration (for FASE 3 wizard)
 */
export async function createEventWithModules(
  clientId: string,
  eventData: {
    name: string;
    event_date: string;
    event_time?: string | null;
    location?: string | null;
    venue_address?: string | null;
    timezone?: string;
    has_invitation: boolean;
    has_guestbook: boolean;
    invitation_config?: any;
    guestbook_config?: any;
    seating_mode?: string;
  }
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();

  const insertData: any = {
    client_id: clientId,
    event_name: eventData.name,
    event_date: eventData.event_date,
    event_time: eventData.event_time,
    venue_name: eventData.location,
    venue_address: eventData.venue_address,
    is_active: true,
    has_invitation: eventData.has_invitation,
    has_guestbook: eventData.has_guestbook,
    invitation_config: eventData.invitation_config || {},
    guestbook_config: eventData.guestbook_config || {},
    seating_mode: eventData.seating_mode || 'no_seat',
    staff_quota: 5,
    staff_quota_used: 0,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating event with modules:', error);
    return null;
  }

  // Default guest types will be auto-created by trigger
  // (see migration 005_update_guest_types_event_scope.sql)

  return data as Event;
}

/**
 * Get event by ID with client access validation
 */
export async function getEventByIdWithAccess(
  eventId: string,
  clientId: string
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Event;
}
