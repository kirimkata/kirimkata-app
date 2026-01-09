/**
 * Shared Code Index
 * 
 * This file re-exports all shared code from invitation app.
 * Invitation app is the source of truth for types, services, and repositories.
 * 
 * Strategy: Import from invitation/lib/guestbook
 * Benefit: Single source of truth, no duplication, always in sync
 */

// ============================================================================
// TYPES - All TypeScript interfaces and types
// ============================================================================
export type {
  // Core Types
  GuestSource,
  CheckinMethod,
  StaffType,
  StaffAction,
  InvitationStatus,
  InvitationVia,
  
  // Entities
  Event,
  GuestType,
  GuestTypeBenefit,
  EventGuest,
  Client,
  GuestbookStaff,
  StaffLog,
  
  // JWT Payloads
  QRTokenPayload,
  ClientJWTPayload,
  StaffJWTPayload,
  JWTPayload,
  
  // API Response
  ApiResponse,
  
  // Dashboard & Stats
  DashboardStats,
  EventGuestSummary,
  GuestWithBenefits,
  
  // Forms
  CheckinFormData,
  StaffLogFormData,
  GuestSearchResult,
  
  // Seating
  EventSeatingConfig,
  BenefitCatalog,
  EventGuestWithSeating,
} from '../../invitation/lib/guestbook/types';

// ============================================================================
// JWT SERVICE - Token generation and verification
// ============================================================================
export {
  generateClientToken,
  generateStaffToken,
  verifyToken,
  verifyClientToken,
  verifyStaffToken,
  generateQRToken,
  verifyQRToken,
  extractTokenFromHeader,
  hashQRToken,
} from '../../invitation/lib/guestbook/services/jwt';

// ============================================================================
// ENCRYPTION SERVICE - Password hashing and comparison
// ============================================================================
export {
  hashPassword,
  comparePassword,
} from '../../invitation/lib/guestbook/services/encryption';

// ============================================================================
// REPOSITORIES - Database access functions
// ============================================================================

// Event Repository
export {
  getEventById,
  getEventByIdWithAccess,
  getClientEvents,
  createEvent,
  createEventWithModules,
  updateEvent,
  deleteEvent,
} from '../../invitation/lib/guestbook/repositories/eventRepository';

// Guest Repository
export {
  getEventGuests,
  getGuestStats,
  createGuest,
  updateGuest,
  deleteGuest,
} from '../../invitation/lib/guestbook/repositories/guestRepository';

// Guest Type Repository
export {
  getEventGuestTypes,
  getClientDefaultGuestTypes,
  getGuestTypeById,
  createGuestType,
  updateGuestType,
  deleteGuestType,
  reorderGuestTypes,
  getGuestTypeStats,
  cloneClientGuestTypesToEvent,
} from '../../invitation/lib/guestbook/repositories/guestTypeRepository';

// Benefit Repository
export {
  getBenefitByType,
  getBenefitMatrix,
  bulkAssignBenefits,
} from '../../invitation/lib/guestbook/repositories/benefitRepository';

// Seating Config Repository
export {
  getSeatingConfigById,
  createSeatingConfig,
  bulkCreateSeatingConfigs,
  updateSeatingConfig,
  deleteSeatingConfig,
  getSeatingStats,
} from '../../invitation/lib/guestbook/repositories/seatingConfigRepository';

// Seating Repository - Export all available functions
export * from '../../invitation/lib/guestbook/repositories/seatingRepository';

// Staff Repository - Export all available functions
export * from '../../invitation/lib/guestbook/repositories/staffRepository';

// Log Repository - Export all available functions
export * from '../../invitation/lib/guestbook/repositories/logRepository';

// ============================================================================
// SUPABASE CLIENT - Use guestbook's own implementation
// ============================================================================
// Note: We keep guestbook's supabase.ts because it has browser client
// Import from './supabase' not from invitation
export {
  getSupabaseClient,
  getSupabaseServiceClient,
} from './supabase';
