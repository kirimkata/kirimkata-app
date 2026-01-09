import { getSupabaseServiceClient } from '../supabase';
import { BenefitCatalog, GuestTypeBenefit } from '../types';

/**
 * Get all benefits from catalog
 */
export async function getBenefitCatalog(): Promise<BenefitCatalog[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('benefit_catalog')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching benefit catalog:', error);
    return [];
  }

  return (data as BenefitCatalog[]) || [];
}

/**
 * Get benefit by type
 */
export async function getBenefitByType(benefitType: string): Promise<BenefitCatalog | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('benefit_catalog')
    .select('*')
    .eq('benefit_type', benefitType)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BenefitCatalog;
}

/**
 * Create new benefit in catalog
 */
export async function createBenefit(benefitData: {
  benefit_type: string;
  display_name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}): Promise<BenefitCatalog | null> {
  const supabase = getSupabaseServiceClient();

  const insertData = {
    benefit_type: benefitData.benefit_type,
    display_name: benefitData.display_name,
    description: benefitData.description || null,
    icon: benefitData.icon || null,
    sort_order: benefitData.sort_order || 0,
  };

  const { data, error } = await supabase
    .from('benefit_catalog')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating benefit:', error);
    return null;
  }

  return data as BenefitCatalog;
}

/**
 * Get benefits assigned to a guest type
 */
export async function getGuestTypeBenefits(guestTypeId: string): Promise<GuestTypeBenefit[]> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('guest_type_benefits')
    .select('*')
    .eq('guest_type_id', guestTypeId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching guest type benefits:', error);
    return [];
  }

  return (data as GuestTypeBenefit[]) || [];
}

/**
 * Assign benefit to guest type
 */
export async function assignBenefitToGuestType(
  guestTypeId: string,
  benefitType: string,
  quantity: number,
  description?: string
): Promise<GuestTypeBenefit | null> {
  const supabase = getSupabaseServiceClient();

  const insertData = {
    guest_type_id: guestTypeId,
    benefit_type: benefitType,
    quantity: quantity,
    description: description || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('guest_type_benefits')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error assigning benefit:', error);
    return null;
  }

  return data as GuestTypeBenefit;
}

/**
 * Update benefit assignment
 */
export async function updateGuestTypeBenefit(
  benefitId: string,
  updates: { quantity?: number; description?: string; is_active?: boolean }
): Promise<GuestTypeBenefit | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('guest_type_benefits')
    .update(updates)
    .eq('id', benefitId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating benefit:', error);
    return null;
  }

  return data as GuestTypeBenefit;
}

/**
 * Remove benefit from guest type (soft delete)
 */
export async function removeBenefitFromGuestType(benefitId: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('guest_type_benefits')
    .update({ is_active: false })
    .eq('id', benefitId);

  if (error) {
    console.error('Error removing benefit:', error);
    return false;
  }

  return true;
}

/**
 * Bulk assign benefits to guest type
 */
export async function bulkAssignBenefits(
  guestTypeId: string,
  benefits: Array<{ benefit_type: string; quantity: number; description?: string }>
): Promise<GuestTypeBenefit[]> {
  const supabase = getSupabaseServiceClient();

  const insertData = benefits.map(b => ({
    guest_type_id: guestTypeId,
    benefit_type: b.benefit_type,
    quantity: b.quantity,
    description: b.description || null,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('guest_type_benefits')
    .insert(insertData)
    .select();

  if (error || !data) {
    console.error('Error bulk assigning benefits:', error);
    return [];
  }

  return data as GuestTypeBenefit[];
}

/**
 * Get benefit matrix for an event (all guest types with their benefits)
 */
export async function getBenefitMatrix(eventId: string): Promise<{
  guest_types: Array<{
    id: string;
    type_name: string;
    display_name: string;
    color_code: string;
    benefits: GuestTypeBenefit[];
  }>;
  all_benefits: BenefitCatalog[];
}> {
  const supabase = getSupabaseServiceClient();

  // Get all guest types for this event
  const { data: guestTypes, error: gtError } = await supabase
    .from('guest_types')
    .select('*')
    .eq('event_id', eventId)
    .order('priority_order', { ascending: true });

  if (gtError || !guestTypes) {
    return { guest_types: [], all_benefits: [] };
  }

  // Get all benefits for these guest types
  const guestTypeIds = guestTypes.map(gt => gt.id);
  const { data: benefits, error: bError } = await supabase
    .from('guest_type_benefits')
    .select('*')
    .in('guest_type_id', guestTypeIds)
    .eq('is_active', true);

  // Get benefit catalog
  const catalog = await getBenefitCatalog();

  // Map benefits to guest types
  const guestTypesWithBenefits = guestTypes.map(gt => ({
    id: gt.id,
    type_name: gt.type_name,
    display_name: gt.display_name,
    color_code: gt.color_code,
    benefits: (benefits || []).filter(b => b.guest_type_id === gt.id),
  }));

  return {
    guest_types: guestTypesWithBenefits,
    all_benefits: catalog,
  };
}
