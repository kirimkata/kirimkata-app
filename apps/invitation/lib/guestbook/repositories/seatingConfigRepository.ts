import { getSupabaseServiceClient } from '../supabase';
import { EventSeatingConfig } from '../types';

/**
 * Get all seating configurations for an event
 */
export async function getEventSeatingConfigs(eventId: string): Promise<EventSeatingConfig[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_seating_config')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching seating configs:', error);
    return [];
  }

  return (data as EventSeatingConfig[]) || [];
}

/**
 * Get seating config by ID
 */
export async function getSeatingConfigById(configId: string): Promise<EventSeatingConfig | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('event_seating_config')
    .select('*')
    .eq('id', configId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as EventSeatingConfig;
}

/**
 * Create new seating configuration
 */
export async function createSeatingConfig(
  eventId: string,
  configData: {
    seating_type: 'table' | 'seat' | 'zone';
    name: string;
    capacity: number;
    allowed_guest_type_ids?: string[];
    position_data?: any;
    sort_order?: number;
  }
): Promise<EventSeatingConfig | null> {
  const supabase = getSupabaseServiceClient();

  const insertData = {
    event_id: eventId,
    seating_type: configData.seating_type,
    name: configData.name,
    capacity: configData.capacity,
    allowed_guest_type_ids: configData.allowed_guest_type_ids || [],
    position_data: configData.position_data || null,
    is_active: true,
    sort_order: configData.sort_order || 0,
  };

  const { data, error } = await supabase
    .from('event_seating_config')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating seating config:', error);
    return null;
  }

  return data as EventSeatingConfig;
}

/**
 * Update seating configuration
 */
export async function updateSeatingConfig(
  configId: string,
  updates: Partial<Omit<EventSeatingConfig, 'id' | 'event_id' | 'created_at' | 'updated_at'>>
): Promise<EventSeatingConfig | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('event_seating_config')
    .update(updates)
    .eq('id', configId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating seating config:', error);
    return null;
  }

  return data as EventSeatingConfig;
}

/**
 * Delete seating configuration (soft delete by setting is_active = false)
 */
export async function deleteSeatingConfig(configId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('event_seating_config')
    .update({ is_active: false })
    .eq('id', configId);

  if (error) {
    console.error('Error deleting seating config:', error);
    return false;
  }

  return true;
}

/**
 * Get seating statistics for an event
 */
export async function getSeatingStats(eventId: string): Promise<{
  total_capacity: number;
  assigned_seats: number;
  available_seats: number;
  by_type: Record<string, { total: number; assigned: number }>;
}> {
  const supabase = getSupabaseServiceClient();

  // Get all seating configs
  const { data: configs, error: configError } = await supabase
    .from('event_seating_config')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true);

  if (configError || !configs) {
    return {
      total_capacity: 0,
      assigned_seats: 0,
      available_seats: 0,
      by_type: {},
    };
  }

  // Get assigned seats count
  const { count: assignedCount, error: countError } = await supabase
    .from('invitation_guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('seating_config_id', 'is', null);

  const assigned = assignedCount || 0;
  const totalCapacity = configs.reduce((sum, config) => sum + config.capacity, 0);

  // Group by seating type
  const byType: Record<string, { total: number; assigned: number }> = {};
  
  for (const config of configs) {
    if (!byType[config.seating_type]) {
      byType[config.seating_type] = { total: 0, assigned: 0 };
    }
    byType[config.seating_type].total += config.capacity;
  }

  // Count assigned per type
  for (const type of Object.keys(byType)) {
    const { count, error } = await supabase
      .from('invitation_guests')
      .select('seating_config_id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('seating_config_id', configs.filter(c => c.seating_type === type).map(c => c.id));

    byType[type].assigned = count || 0;
  }

  return {
    total_capacity: totalCapacity,
    assigned_seats: assigned,
    available_seats: totalCapacity - assigned,
    by_type: byType,
  };
}

/**
 * Bulk create seating configurations
 */
export async function bulkCreateSeatingConfigs(
  eventId: string,
  configs: Array<{
    seating_type: 'table' | 'seat' | 'zone';
    name: string;
    capacity: number;
    allowed_guest_type_ids?: string[];
    position_data?: any;
    sort_order?: number;
  }>
): Promise<EventSeatingConfig[]> {
  const supabase = getSupabaseServiceClient();

  const insertData = configs.map((config, index) => ({
    event_id: eventId,
    seating_type: config.seating_type,
    name: config.name,
    capacity: config.capacity,
    allowed_guest_type_ids: config.allowed_guest_type_ids || [],
    position_data: config.position_data || null,
    is_active: true,
    sort_order: config.sort_order ?? index,
  }));

  const { data, error } = await supabase
    .from('event_seating_config')
    .insert(insertData)
    .select();

  if (error || !data) {
    console.error('Error bulk creating seating configs:', error);
    return [];
  }

  return data as EventSeatingConfig[];
}
