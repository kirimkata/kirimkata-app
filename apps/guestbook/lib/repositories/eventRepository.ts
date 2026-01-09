import { getSupabaseServiceClient } from '../supabase';
import { Event, EventGuest, GuestType, GuestTypeBenefit, EventGuestSummary, GuestWithBenefits } from '../types';

/**
 * Get all events for a client
 */
export async function getClientEvents(clientId: string): Promise<Event[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
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
    use_invitation?: boolean;
    use_guestbook?: boolean;
    allow_walkin?: boolean;
    require_invitation?: boolean;
    auto_generate_qr?: boolean;
  }
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();

  const insertData: any = {
    client_id: clientId,
    event_name: name,
    event_date: eventDate,
    venue_name: location,
    is_active: true
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
 * Get event guest summary using database view
 */
export async function getEventGuestSummary(eventId: string): Promise<EventGuestSummary | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('v_event_guest_summary')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as EventGuestSummary;
}

/**
 * Get all guests for an event with benefits
 */
export async function getEventGuestsWithBenefits(eventId: string): Promise<GuestWithBenefits[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('v_guest_with_benefits')
    .select('*')
    .eq('event_id', eventId)
    .order('guest_name');

  if (error) {
    console.error('Error fetching guests with benefits:', error);
    return [];
  }

  return (data as GuestWithBenefits[]) || [];
}

/**
 * Get guest types for an event
 */
export async function getEventGuestTypes(eventId: string): Promise<GuestType[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_types')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  if (error) {
    console.error('Error fetching guest types:', error);
    return [];
  }

  return (data as GuestType[]) || [];
}

/**
 * Create guest type for event
 */
export async function createGuestType(
  eventId: string,
  name: string,
  description?: string,
  sortOrder?: number
): Promise<GuestType | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('guest_types')
    .insert({
      event_id: eventId,
      name,
      description,
      sort_order: sortOrder ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating guest type:', error);
    return null;
  }

  return data as GuestType;
}

/**
 * Get benefits for a guest type
 */
export async function getGuestTypeBenefits(guestTypeId: string): Promise<GuestTypeBenefit[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_type_benefits')
    .select('*')
    .eq('guest_type_id', guestTypeId);

  if (error) {
    console.error('Error fetching guest type benefits:', error);
    return [];
  }

  return (data as GuestTypeBenefit[]) || [];
}

/**
 * Set benefits for a guest type
 */
export async function setGuestTypeBenefits(
  guestTypeId: string,
  benefits: { benefit_key: string; benefit_value: string }[]
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  // Delete existing benefits
  await supabase
    .from('guest_type_benefits')
    .delete()
    .eq('guest_type_id', guestTypeId);

  // Insert new benefits
  if (benefits.length > 0) {
    const { error } = await supabase
      .from('guest_type_benefits')
      .insert(
        benefits.map(b => ({
          guest_type_id: guestTypeId,
          benefit_key: b.benefit_key,
          benefit_value: b.benefit_value,
        }))
      );

    if (error) {
      console.error('Error setting guest type benefits:', error);
      return false;
    }
  }

  return true;
}
