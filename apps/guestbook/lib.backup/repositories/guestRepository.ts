import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceClient } from '../supabase';
import { EventGuest, GuestSearchResult } from '../types';

/**
 * Supabase-backed guest repository used by API routes.
 * Pastikan nama tabel/kolom sesuai dengan schema Supabase Anda.
 */

const GUESTS_TABLE = 'invitation_guests';
const CHECKINS_TABLE = 'guestbook_checkins';

function client(): SupabaseClient {
  return getSupabaseServiceClient();
}

export async function getGuestByQRToken(qrToken: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from(GUESTS_TABLE)
    .select('*')
    // QR token menggunakan guest ID
    .eq('id', qrToken)
    .limit(1)
    .single();

  if (error) return null;
  return data as EventGuest;
}

export async function getGuestById(id: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from(GUESTS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as EventGuest;
}

export async function searchGuests(clientId: string, query: string): Promise<GuestSearchResult[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from(GUESTS_TABLE)
    .select('*')
    .eq('client_id', clientId)
    .or(`guest_name.ilike.%${query}%,guest_phone.ilike.%${query}%`)
    .limit(20);

  if (error || !data) return [];
  return data as GuestSearchResult[];
}

export async function searchGuestsByNameWithGroup(
  clientId: string,
  name: string,
  guestGroup?: string | null
) {
  const supabase = client();
  let qb = supabase
    .from(GUESTS_TABLE)
    .select('*')
    .eq('client_id', clientId)
    .ilike('guest_name', `%${name}%`);

  if (guestGroup) {
    qb = qb.eq('guest_group', guestGroup);
  }

  const { data, error } = await qb.limit(10);
  if (error || !data) return [];
  return data as GuestSearchResult[];
}

export async function isGuestCheckedIn(guestId: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from(CHECKINS_TABLE)
    .select('id')
    .eq('guest_id', guestId)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function getGuestsByTable(clientId: string, tableNumber: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from(GUESTS_TABLE)
    .select('*')
    .eq('client_id', clientId)
    .eq('table_number', tableNumber);

  if (error || !data) return [];
  return data as GuestSearchResult[];
}

export async function getGuestsBySeatingArea(clientId: string, seatingArea: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from(GUESTS_TABLE)
    .select('*')
    .eq('client_id', clientId)
    .eq('seating_area', seatingArea);

  if (error || !data) return [];
  return data as GuestSearchResult[];
}

export async function isSeatingAvailable(
  clientId: string,
  tableNumber: string,
  seatNumber?: string | null
) {
  const supabase = client();
  let qb = supabase
    .from(GUESTS_TABLE)
    .select('id')
    .eq('client_id', clientId)
    .eq('table_number', tableNumber);

  if (seatNumber) {
    qb = qb.eq('seat_number', seatNumber);
  }

  const { data, error } = await qb.limit(1);
  if (error) return false;
  return (data?.length ?? 0) === 0;
}

export async function assignSeating(
  guestId: string,
  tableNumber: string,
  seatNumber?: string | null,
  seatingArea?: string | null
) {
  const supabase = client();
  const { error } = await supabase
    .from(GUESTS_TABLE)
    .update({
      table_number: tableNumber,
      seat_number: seatNumber ?? null,
      seating_area: seatingArea ?? null,
    })
    .eq('id', guestId);

  return !error;
}

export async function getSeatingStats(clientId: string) {
  const supabase = client();

  const { data: areaRows } = await supabase
    .from(GUESTS_TABLE)
    .select('seating_area')
    .eq('client_id', clientId)
    .not('seating_area', 'is', null);

  const { data: tableRows } = await supabase
    .from(GUESTS_TABLE)
    .select('table_number')
    .eq('client_id', clientId)
    .not('table_number', 'is', null);

  const byArea = (areaRows || []).reduce<Record<string, number>>((acc, row: any) => {
    const key = row.seating_area;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byTable = (tableRows || []).reduce<Record<string, number>>((acc, row: any) => {
    const key = row.table_number;
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    byArea,
    byTable,
  };
}

export async function getGuestStats(clientId: string) {
  const supabase = client();

  const { count: totalGuests = 0 } = await supabase
    .from(GUESTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const { count: checkedInGuests = 0 } = await supabase
    .from(CHECKINS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  return {
    total_guests: totalGuests ?? 0,
    checked_in_guests: checkedInGuests ?? 0,
  };
}
