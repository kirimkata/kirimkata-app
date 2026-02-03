import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export type AttendanceStatus = 'hadir' | 'tidak-hadir' | 'masih-ragu';

export interface WishInsert {
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
}

export interface WishRow {
  id: number;
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
  createdAt: string;
}

interface WishRecord {
  id: number;
  invitation_slug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guest_count: number;
  created_at: string;
}

const TABLE_NAME = 'wishes';

function mapWishRecord(row: WishRecord): WishRow {
  return {
    id: row.id,
    invitationSlug: row.invitation_slug,
    name: row.name,
    message: row.message,
    attendance: row.attendance,
    guestCount: row.guest_count,
    createdAt: row.created_at,
  };
}

export async function createWish(data: WishInsert): Promise<WishRow> {
  const supabase = getSupabaseClient();

  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      invitation_slug: data.invitationSlug,
      name: data.name,
      message: data.message,
      attendance: data.attendance,
      guest_count: data.guestCount,
    })
    .select('*')
    .single();

  if (error || !row) {
    console.error('Error inserting wish', error);
    throw error || new Error('Failed to insert wish');
  }

  return mapWishRecord(row as WishRecord);
}

export async function listWishes(invitationSlug: string): Promise<WishRow[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('invitation_slug', invitationSlug)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error loading wishes', error);
    throw error;
  }

  const rows = (data || []) as WishRecord[];
  return rows.map(mapWishRecord);
}
