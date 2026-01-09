// Core Types
export type GuestSource = 'registered' | 'walkin';
export type CheckinMethod = 'QR_SCAN' | 'MANUAL_SEARCH';
export type StaffType = 'usher' | 'souvenir' | 'snack' | 'meal' | 'admin';
export type StaffAction = 'checkin' | 'souvenir' | 'snack' | 'meal' | 'other';
export type InvitationStatus = 'sent' | 'failed' | 'delivered' | 'read';
export type InvitationVia = 'whatsapp' | 'email' | 'sms';

// Event - Core entity yang menghubungkan invitation dan guestbook
export interface Event {
  id: string;
  client_id: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  is_active: boolean;
  
  // Module flags
  has_invitation: boolean;
  has_guestbook: boolean;
  
  // Module configurations
  invitation_config: {
    rsvp_enabled?: boolean;
    max_guests_per_invitation?: number;
    auto_generate_qr?: boolean;
  };
  guestbook_config: {
    checkin_mode?: 'qr_scan' | 'manual' | 'both';
    offline_support?: boolean;
    qr_validation?: 'strict' | 'loose';
  };
  
  // Seating mode
  seating_mode: 'no_seat' | 'table_based' | 'numbered_seat' | 'zone_based';
  
  staff_quota: number;
  staff_quota_used: number;
  created_at: string;
  updated_at: string;
}

// Guest Type - Kategori tamu yang bisa dikustomisasi per event
export interface GuestType {
  id: string;
  client_id: string;
  event_id: string | null; // NULL = client-level default, NOT NULL = event-specific
  type_name: string;
  display_name: string;
  color_code: string;
  priority_order: number;
  created_at: string;
}

// Guest Type Benefits - Benefit yang didapat per tipe tamu
export interface GuestTypeBenefit {
  id: string;
  guest_type_id: string;
  benefit_type: string;
  quantity: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Event Guest - Single source of truth untuk semua tamu
export interface EventGuest {
  id: string;
  event_id: string;
  source: GuestSource;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  guest_type_id: string | null;
  should_send_invitation: boolean;
  invitation_sent: boolean;
  invitation_sent_at: string | null;
  qr_code: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  max_companions: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Relations
  event?: Event;
  guest_type?: GuestType;
  benefits?: GuestTypeBenefit[];
}

// Client sebagai owner/admin guestbook
export interface Client {
  id: string;
  username: string;
  password_encrypted: string;
  email: string | null;
  slug: string | null;
  quota_photos: number;
  quota_music: number;
  quota_videos: number;
  message_template: string | null;
  created_at: string;
  updated_at: string;
}

// Guestbook Staff
export interface GuestbookStaff {
  id: string;
  event_id: string;
  username: string;
  password_encrypted: string;
  full_name: string;
  phone: string | null;
  can_checkin: boolean;
  can_redeem_souvenir: boolean;
  can_redeem_snack: boolean;
  can_access_vip_lounge: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Staff Log - Audit trail untuk aksi staff
export interface StaffLog {
  id: string;
  staff_id: string;
  event_guest_id: string;
  action: StaffAction;
  notes: string | null;
  created_at: string;
  // Relations
  staff?: GuestbookStaff;
  event_guest?: EventGuest;
}

// QR Token Types
export interface QRTokenPayload {
  guest_id: string;
  event_id: string;
  guest_name: string;
  exp: number;
  iat: number;
  nonce: string;
}

// JWT Auth Types - Client sebagai owner dengan akses penuh
export interface ClientJWTPayload {
  client_id: string;
  username: string;
  email: string | null;
  slug: string | null;
  guestbook_access: boolean;
  type: 'CLIENT';
  exp: number;
  iat: number;
}

// JWT Auth Types - Staff
export interface StaffJWTPayload {
  staff_id: string;
  event_id: string;
  client_id: string;
  name: string;
  staff_type: StaffType;
  can_checkin: boolean;
  can_redeem_souvenir: boolean;
  can_redeem_snack: boolean;
  can_access_vip_lounge: boolean;
  type: 'STAFF';
  exp: number;
  iat: number;
}

// Union type untuk semua JWT payload
export type JWTPayload = ClientJWTPayload | StaffJWTPayload;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_guests: number;
  checked_in_guests: number;
  registered_guests: number;
  walkin_guests: number;
  invitations_sent: number;
  guest_types_breakdown: Record<string, number>;
  recent_checkins: EventGuest[];
  recent_staff_logs: StaffLog[];
}

// Event Summary View Type
export interface EventGuestSummary {
  event_id: string;
  event_name: string;
  client_id: string;
  total_guests: number;
  registered_guests: number;
  walkin_guests: number;
  invitations_sent: number;
  checked_in_guests: number;
  not_checked_in: number;
}

// Guest with Benefits View Type
export interface GuestWithBenefits {
  id: string;
  event_id: string;
  guest_name: string;
  guest_phone: string | null;
  source: GuestSource;
  is_checked_in: boolean;
  guest_type: string | null;
  benefits: Record<string, string> | null;
}

// Form Types
export interface CheckinFormData {
  guest_id: string;
  method: CheckinMethod;
  notes?: string;
}

export interface StaffLogFormData {
  guest_id: string;
  action: StaffAction;
  notes?: string;
}

export interface GuestSearchResult extends Omit<EventGuest, 'benefits'> {
  guest_type_name?: string;
  benefits?: Record<string, string>;
  staff_logs?: StaffLog[];
}

// Event Seating Configuration
export interface EventSeatingConfig {
  id: string;
  event_id: string;
  seating_type: 'table' | 'seat' | 'zone';
  name: string;
  capacity: number;
  allowed_guest_type_ids: string[];
  position_data?: {
    x?: number;
    y?: number;
    floor?: string;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Benefit Catalog
export interface BenefitCatalog {
  id: string;
  benefit_type: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

// Extended EventGuest with seating info
export interface EventGuestWithSeating extends EventGuest {
  guest_group?: string;
  seating_config_id?: string;
  seating_config?: EventSeatingConfig;
  actual_companions?: number;
}
