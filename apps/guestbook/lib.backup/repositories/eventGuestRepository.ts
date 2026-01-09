import { getSupabaseServiceClient } from '../supabase';
import { EventGuest, GuestSource, GuestSearchResult, StaffLog } from '../types';

/**
 * Get all event guests with pagination and filters
 */
export async function getEventGuests(
  eventId: string,
  page: number = 1,
  limit: number = 50,
  source?: GuestSource,
  search?: string
): Promise<{ guests: EventGuest[]; total: number }> {
  const supabase = getSupabaseServiceClient();
  
  let query = supabase
    .from('event_guests')
    .select('*, guest_types(name), events(name)', { count: 'exact' })
    .eq('event_id', eventId);

  if (source) {
    query = query.eq('source', source);
  }

  if (search) {
    query = query.or(`guest_name.ilike.%${search}%,guest_phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    console.error('Error fetching event guests:', error);
    return { guests: [], total: 0 };
  }

  return {
    guests: (data as EventGuest[]) || [],
    total: count || 0
  };
}

/**
 * Get event guest by ID with full details
 */
export async function getEventGuestById(id: string): Promise<GuestSearchResult | null> {
  const supabase = getSupabaseServiceClient();

  const { data: guest, error: guestError } = await supabase
    .from('event_guests')
    .select(`
      *,
      events(name, client_id),
      guest_types(name),
      staff_logs(*, staffs(name, staff_type))
    `)
    .eq('id', id)
    .single();

  if (guestError || !guest) {
    return null;
  }

  // Get benefits from guest type
  let benefits: Record<string, string> = {};
  if (guest.guest_type_id) {
    const { data: benefitData } = await supabase
      .from('guest_type_benefits')
      .select('benefit_key, benefit_value')
      .eq('guest_type_id', guest.guest_type_id);

    if (benefitData) {
      benefits = benefitData.reduce((acc, b) => {
        acc[b.benefit_key] = b.benefit_value;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return {
    ...guest,
    guest_type_name: guest.guest_types?.name,
    benefits,
    staff_logs: guest.staff_logs || []
  } as GuestSearchResult;
}

/**
 * Search event guests by name or phone
 */
export async function searchEventGuests(eventId: string, query: string): Promise<GuestSearchResult[]> {
  const supabase = getSupabaseServiceClient();

  const { data: guests, error } = await supabase
    .from('event_guests')
    .select(`
      *,
      guest_types(name),
      staff_logs(*, staffs(name, staff_type))
    `)
    .eq('event_id', eventId)
    .or(`guest_name.ilike.%${query}%,guest_phone.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching event guests:', error);
    return [];
  }

  return (guests || []).map((guest: any) => ({
    ...guest,
    guest_type_name: guest.guest_types?.name,
    staff_logs: guest.staff_logs || []
  })) as GuestSearchResult[];
}

/**
 * Get event guest by QR code
 */
export async function getEventGuestByQR(qrCode: string): Promise<EventGuest | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_guests')
    .select('*, events(name, client_id), guest_types(name)')
    .eq('qr_code', qrCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data as EventGuest;
}

/**
 * Create new event guest
 */
export async function createEventGuest(
  eventId: string,
  guestName: string,
  source: GuestSource = 'registered',
  options?: {
    guest_phone?: string;
    guest_email?: string;
    guest_type_id?: string;
    should_send_invitation?: boolean;
    max_companions?: number;
    notes?: string;
    created_by?: string;
  }
): Promise<EventGuest | null> {
  const supabase = getSupabaseServiceClient();

  const insertData = {
    event_id: eventId,
    source,
    guest_name: guestName,
    guest_phone: options?.guest_phone || null,
    guest_email: options?.guest_email || null,
    guest_type_id: options?.guest_type_id || null,
    should_send_invitation: options?.should_send_invitation ?? (source === 'registered'),
    max_companions: options?.max_companions ?? 0,
    notes: options?.notes || null,
    created_by: options?.created_by || 'client',
  };

  const { data, error } = await supabase
    .from('event_guests')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating event guest:', error);
    return null;
  }

  return data as EventGuest;
}

/**
 * Update event guest
 */
export async function updateEventGuest(
  id: string,
  updates: Partial<Pick<EventGuest, 'guest_name' | 'guest_phone' | 'guest_email' | 'guest_type_id' | 'max_companions' | 'notes'>>
): Promise<EventGuest | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_guests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating event guest:', error);
    return null;
  }

  return data as EventGuest;
}

/**
 * Check in event guest
 */
export async function checkInEventGuest(
  guestId: string,
  staffId?: string
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('event_guests')
    .update({
      is_checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: staffId || null,
    })
    .eq('id', guestId);

  if (error) {
    console.error('Error checking in guest:', error);
    return false;
  }

  return true;
}

/**
 * Generate and assign QR code to guest
 */
export async function generateGuestQRCode(guestId: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();

  // Generate QR code using database function
  const { data, error } = await supabase
    .rpc('generate_qr_code', { guest_id: guestId });

  if (error || !data) {
    console.error('Error generating QR code:', error);
    return null;
  }

  const qrCode = data as string;

  // Update guest with QR code
  const { error: updateError } = await supabase
    .from('event_guests')
    .update({ qr_code: qrCode })
    .eq('id', guestId);

  if (updateError) {
    console.error('Error updating guest QR code:', error);
    return null;
  }

  return qrCode;
}

/**
 * Mark invitation as sent
 */
export async function markInvitationSent(guestId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('event_guests')
    .update({
      invitation_sent: true,
      invitation_sent_at: new Date().toISOString(),
    })
    .eq('id', guestId);

  if (error) {
    console.error('Error marking invitation as sent:', error);
    return false;
  }

  return true;
}

/**
 * Get event guest statistics
 */
export async function getEventGuestStats(eventId: string): Promise<{
  total: number;
  registered: number;
  walkin: number;
  checked_in: number;
  invitations_sent: number;
  guest_types: Record<string, number>;
}> {
  const supabase = getSupabaseServiceClient();

  const { data: guests, error } = await supabase
    .from('event_guests')
    .select('source, is_checked_in, invitation_sent, guest_types(name)')
    .eq('event_id', eventId);

  if (error || !guests) {
    return { 
      total: 0, 
      registered: 0, 
      walkin: 0, 
      checked_in: 0, 
      invitations_sent: 0,
      guest_types: {}
    };
  }

  const stats = {
    total: guests.length,
    registered: 0,
    walkin: 0,
    checked_in: 0,
    invitations_sent: 0,
    guest_types: {} as Record<string, number>
  };

  guests.forEach((guest: any) => {
    if (guest.source === 'registered') {
      stats.registered++;
    } else if (guest.source === 'walkin') {
      stats.walkin++;
    }

    if (guest.is_checked_in) {
      stats.checked_in++;
    }

    if (guest.invitation_sent) {
      stats.invitations_sent++;
    }

    if (guest.guest_types?.name) {
      const typeName = guest.guest_types.name;
      stats.guest_types[typeName] = (stats.guest_types[typeName] || 0) + 1;
    }
  });

  return stats;
}

/**
 * Get recent check-ins for an event
 */
export async function getRecentCheckIns(eventId: string, limit: number = 10): Promise<EventGuest[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_guests')
    .select('*, guest_types(name)')
    .eq('event_id', eventId)
    .eq('is_checked_in', true)
    .order('checked_in_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent check-ins:', error);
    return [];
  }

  return (data as EventGuest[]) || [];
}
