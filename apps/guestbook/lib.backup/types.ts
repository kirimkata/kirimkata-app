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
  name: string;
  event_date: string | null;
  location: string | null;
  use_invitation: boolean;
  use_guestbook: boolean;
  allow_walkin: boolean;
  require_invitation: boolean;
  auto_generate_qr: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Guest Type - Kategori tamu yang bisa dikustomisasi per event
export interface GuestType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

// Guest Type Benefits - Benefit yang didapat per tipe tamu
export interface GuestTypeBenefit {
  id: string;
  guest_type_id: string;
  benefit_key: string;
  benefit_value: string;
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

// Staff - Simplified dengan PIN-based auth
export interface Staff {
  id: string;
  event_id: string;
  name: string;
  staff_type: StaffType;
  pin_code: string;
  is_active: boolean;
  created_at: string;
  // Relations
  event?: Event;
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
  staff?: Staff;
  event_guest?: EventGuest;
}

// Invitation History - Audit trail untuk pengiriman undangan
export interface InvitationHistory {
  id: string;
  event_guest_id: string;
  sent_at: string;
  sent_via: InvitationVia;
  status: InvitationStatus;
  error_message: string | null;
  // Relations
  event_guest?: EventGuest;
}

// Client Media - File uploads
export interface ClientMedia {
  id: number;
  client_id: string;
  event_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  // Relations
  client?: Client;
  event?: Event;
}

// QR Token Types - menggunakan event_guests.id sebagai identifier
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

// JWT Auth Types - Staff dengan PIN-based auth
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

// Event Summary View Type (matches database view)
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

// Guest with Benefits View Type (matches database view)
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
