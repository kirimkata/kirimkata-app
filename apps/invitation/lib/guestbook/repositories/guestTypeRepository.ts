import { getSupabaseServiceClient } from '../supabase';
import { GuestType } from '../types';

/**
 * Get all guest types for an event
 */
export async function getEventGuestTypes(eventId: string): Promise<GuestType[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_types')
    .select('*')
    .eq('event_id', eventId)
    .order('priority_order', { ascending: true });

  if (error) {
    console.error('Error fetching event guest types:', error);
    return [];
  }

  return (data as GuestType[]) || [];
}

/**
 * Get client-level default guest types
 */
export async function getClientDefaultGuestTypes(clientId: string): Promise<GuestType[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_types')
    .select('*')
    .eq('client_id', clientId)
    .is('event_id', null)
    .order('priority_order', { ascending: true });

  if (error) {
    console.error('Error fetching client guest types:', error);
    return [];
  }

  return (data as GuestType[]) || [];
}

/**
 * Get guest type by ID
 */
export async function getGuestTypeById(guestTypeId: string): Promise<GuestType | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_types')
    .select('*')
    .eq('id', guestTypeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as GuestType;
}

/**
 * Create new guest type for an event
 */
export async function createGuestType(
  clientId: string,
  eventId: string,
  guestTypeData: {
    type_name: string;
    display_name: string;
    color_code: string;
    priority_order?: number;
  }
): Promise<GuestType | null> {
  const supabase = getSupabaseServiceClient();

  const insertData = {
    client_id: clientId,
    event_id: eventId,
    type_name: guestTypeData.type_name,
    display_name: guestTypeData.display_name,
    color_code: guestTypeData.color_code,
    priority_order: guestTypeData.priority_order || 0,
  };

  const { data, error } = await supabase
    .from('guest_types')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating guest type:', error);
    return null;
  }

  return data as GuestType;
}

/**
 * Update guest type
 */
export async function updateGuestType(
  guestTypeId: string,
  updates: Partial<Omit<GuestType, 'id' | 'client_id' | 'event_id' | 'created_at'>>
): Promise<GuestType | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('guest_types')
    .update(updates)
    .eq('id', guestTypeId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating guest type:', error);
    return null;
  }

  return data as GuestType;
}

/**
 * Delete guest type
 */
export async function deleteGuestType(guestTypeId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  // Check if any guests are using this type
  const { count, error: countError } = await supabase
    .from('invitation_guests')
    .select('*', { count: 'exact', head: true })
    .eq('guest_type_id', guestTypeId);

  if (countError) {
    console.error('Error checking guest type usage:', countError);
    return false;
  }

  if (count && count > 0) {
    console.error('Cannot delete guest type: still in use by guests');
    return false;
  }

  const { error } = await supabase
    .from('guest_types')
    .delete()
    .eq('id', guestTypeId);

  if (error) {
    console.error('Error deleting guest type:', error);
    return false;
  }

  return true;
}

/**
 * Reorder guest types
 */
export async function reorderGuestTypes(
  guestTypeIds: string[],
  eventId: string
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  // Update priority_order for each guest type
  const updates = guestTypeIds.map((id, index) => 
    supabase
      .from('guest_types')
      .update({ priority_order: index + 1 })
      .eq('id', id)
      .eq('event_id', eventId)
  );

  try {
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error reordering guest types:', error);
    return false;
  }
}

/**
 * Get guest type statistics for an event
 */
export async function getGuestTypeStats(eventId: string): Promise<Array<{
  guest_type_id: string;
  type_name: string;
  display_name: string;
  color_code: string;
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
}>> {
  const supabase = getSupabaseServiceClient();

  // Get all guest types for the event
  const guestTypes = await getEventGuestTypes(eventId);

  // Get guest counts per type
  const stats = await Promise.all(
    guestTypes.map(async (guestType) => {
      const { count: total, error: totalError } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('guest_type_id', guestType.id);

      const { count: checkedIn, error: checkedInError } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('guest_type_id', guestType.id)
        .eq('is_checked_in', true);

      return {
        guest_type_id: guestType.id,
        type_name: guestType.type_name,
        display_name: guestType.display_name,
        color_code: guestType.color_code,
        total_guests: total || 0,
        checked_in: checkedIn || 0,
        not_checked_in: (total || 0) - (checkedIn || 0),
      };
    })
  );

  return stats;
}

/**
 * Clone guest types from client defaults to event
 */
export async function cloneClientGuestTypesToEvent(
  clientId: string,
  eventId: string
): Promise<GuestType[]> {
  const supabase = getSupabaseServiceClient();

  // Get client default guest types
  const defaultTypes = await getClientDefaultGuestTypes(clientId);

  if (defaultTypes.length === 0) {
    return [];
  }

  // Clone to event
  const insertData = defaultTypes.map(gt => ({
    client_id: clientId,
    event_id: eventId,
    type_name: gt.type_name,
    display_name: gt.display_name,
    color_code: gt.color_code,
    priority_order: gt.priority_order,
  }));

  const { data, error } = await supabase
    .from('guest_types')
    .insert(insertData)
    .select();

  if (error || !data) {
    console.error('Error cloning guest types:', error);
    return [];
  }

  return data as GuestType[];
}
