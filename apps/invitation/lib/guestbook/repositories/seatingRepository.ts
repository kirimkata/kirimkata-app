import { getSupabaseServiceClient } from '../supabase';

/**
 * Get seating data for an event
 */
export async function getEventSeating(eventId: string) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_guests')
    .select('id, guest_name, table_number, seating_area')
    .eq('event_id', eventId)
    .order('table_number', { ascending: true });

  if (error) {
    console.error('Error fetching seating data:', error);
    return [];
  }

  return data || [];
}

/**
 * Get seating statistics for an event
 */
export async function getSeatingStats(eventId: string) {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_guests')
    .select('table_number, seating_area')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching seating stats:', error);
    return {
      total_assigned: 0,
      total_unassigned: 0,
      tables: {},
      areas: {},
    };
  }

  const guests = data || [];
  const assigned = guests.filter((g: any) => g.table_number);
  const unassigned = guests.filter((g: any) => !g.table_number);

  // Count by table
  const tables: { [key: string]: number } = {};
  assigned.forEach((g: any) => {
    if (g.table_number) {
      tables[g.table_number] = (tables[g.table_number] || 0) + 1;
    }
  });

  // Count by area
  const areas: { [key: string]: number } = {};
  assigned.forEach((g: any) => {
    if (g.seating_area) {
      areas[g.seating_area] = (areas[g.seating_area] || 0) + 1;
    }
  });

  return {
    total_assigned: assigned.length,
    total_unassigned: unassigned.length,
    tables,
    areas,
  };
}

/**
 * Update guest seating
 */
export async function updateGuestSeating(
  guestId: string,
  tableNumber: string | null,
  seatingArea: string | null
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('event_guests')
    .update({
      table_number: tableNumber,
      seating_area: seatingArea,
    })
    .eq('id', guestId);

  if (error) {
    console.error('Error updating guest seating:', error);
    return false;
  }

  return true;
}
