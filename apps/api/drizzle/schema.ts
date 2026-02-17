import { pgTable, index, foreignKey, pgEnum, serial, uuid, varchar, text, integer, timestamp, bigserial, unique, date, time, boolean, jsonb, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const buckettype = pgEnum("buckettype", ['VECTOR', 'ANALYTICS', 'STANDARD'])
export const equalityOp = pgEnum("equality_op", ['in', 'gte', 'gt', 'lte', 'lt', 'neq', 'eq'])
export const action = pgEnum("action", ['ERROR', 'TRUNCATE', 'DELETE', 'UPDATE', 'INSERT'])
export const factorType = pgEnum("factor_type", ['phone', 'webauthn', 'totp'])
export const factorStatus = pgEnum("factor_status", ['verified', 'unverified'])
export const aalLevel = pgEnum("aal_level", ['aal3', 'aal2', 'aal1'])
export const codeChallengeMethod = pgEnum("code_challenge_method", ['plain', 's256'])
export const oneTimeTokenType = pgEnum("one_time_token_type", ['phone_change_token', 'email_change_token_current', 'email_change_token_new', 'recovery_token', 'reauthentication_token', 'confirmation_token'])
export const oauthRegistrationType = pgEnum("oauth_registration_type", ['manual', 'dynamic'])
export const oauthAuthorizationStatus = pgEnum("oauth_authorization_status", ['expired', 'denied', 'approved', 'pending'])
export const oauthResponseType = pgEnum("oauth_response_type", ['code'])
export const oauthClientType = pgEnum("oauth_client_type", ['confidential', 'public'])


export const clientMedia = pgTable("client_media", {
	id: serial("id").primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: varchar("file_type", { length: 50 }).notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxClientMediaClientType: index("idx_client_media_client_type").on(table.clientId, table.fileType),
		idxClientMediaUploadedAt: index("idx_client_media_uploaded_at").on(table.uploadedAt),
	}
});

export const invitationWishes = pgTable("invitation_wishes", {
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	invitationSlug: text("invitation_slug").notNull(),
	name: text("name").notNull(),
	message: text("message").notNull(),
	attendance: text("attendance").notNull(),
	guestCount: integer("guest_count").default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxWishesInvitationSlug: index("idx_wishes_invitation_slug").on(table.invitationSlug),
		idxWishesCreatedAt: index("idx_wishes_created_at").on(table.createdAt),
	}
});

export const guestTypes = pgTable("guest_types", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	typeName: varchar("type_name", { length: 50 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	colorCode: varchar("color_code", { length: 20 }),
	priorityOrder: integer("priority_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	eventId: uuid("event_id").references(() => guestbookEvents.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		idxGuestTypesClientId: index("idx_guest_types_client_id").on(table.clientId),
		idxGuestTypesEventId: index("idx_guest_types_event_id").on(table.eventId),
		idxGuestTypesClientEvent: index("idx_guest_types_client_event").on(table.clientId, table.eventId),
		uniqueGuestTypePerClientEvent: unique("unique_guest_type_per_client_event").on(table.clientId, table.typeName, table.eventId),
	}
});

export const guestbookEvents = pgTable("guestbook_events", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	eventName: varchar("event_name", { length: 255 }).notNull(),
	eventDate: date("event_date").notNull(),
	eventTime: time("event_time"),
	venueName: varchar("venue_name", { length: 255 }),
	venueAddress: text("venue_address"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	staffQuota: integer("staff_quota").default(2),
	staffQuotaUsed: integer("staff_quota_used").default(0),
	hasInvitation: boolean("has_invitation").default(true),
	hasGuestbook: boolean("has_guestbook").default(false),
	invitationConfig: jsonb("invitation_config").default({}),
	guestbookConfig: jsonb("guestbook_config").default({}),
	seatingMode: varchar("seating_mode", { length: 20 }).default('no_seat'::character varying),
	invitationId: uuid("invitation_id").references(() => invitationPages.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		idxEventsClientId: index("idx_events_client_id").on(table.clientId),
		idxEventsDate: index("idx_events_date").on(table.eventDate),
		idxEventsHasInvitation: index("idx_events_has_invitation").on(table.hasInvitation),
		idxEventsHasGuestbook: index("idx_events_has_guestbook").on(table.hasGuestbook),
		idxEventsSeatingMode: index("idx_events_seating_mode").on(table.seatingMode),
		uniqueEventInvitation: unique("unique_event_invitation").on(table.invitationId),
	}
});

export const guestTypeBenefits = pgTable("guest_type_benefits", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	guestTypeId: uuid("guest_type_id").notNull().references(() => guestTypes.id, { onDelete: "cascade" } ),
	benefitType: varchar("benefit_type", { length: 50 }).notNull(),
	quantity: integer("quantity").default(1),
	description: text("description"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGuestTypeBenefitsActive: index("idx_guest_type_benefits_active").on(table.isActive),
		idxGuestTypeBenefitsGuestType: index("idx_guest_type_benefits_guest_type").on(table.guestTypeId, table.isActive),
	}
});

export const guests = pgTable("guests", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	name: varchar("name", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	sent: boolean("sent").default(false),
	eventId: uuid("event_id").references(() => guestbookEvents.id, { onDelete: "cascade" } ),
	guestCode: varchar("guest_code", { length: 50 }),
	qrCode: text("qr_code"),
	guestTypeId: uuid("guest_type_id").references(() => guestTypes.id, { onDelete: "set null" } ),
	source: varchar("source", { length: 20 }).default('registered'::character varying),
	maxCompanions: integer("max_companions").default(0),
	actualCompanions: integer("actual_companions").default(0),
	tableNumber: integer("table_number"),
	seatNumber: varchar("seat_number", { length: 20 }),
	seatingArea: varchar("seating_area", { length: 100 }),
	isCheckedIn: boolean("is_checked_in").default(false),
	checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: 'string' }),
	notes: text("notes"),
	guestGroup: varchar("guest_group", { length: 100 }),
	seatingConfigId: uuid("seating_config_id").references(() => eventSeatingConfig.id, { onDelete: "set null" } ),
	email: varchar("email", { length: 255 }),
	invitationId: uuid("invitation_id").references(() => invitationPages.id, { onDelete: "cascade" } ),
},
(table) => {
	return {
		idxInvitationGuestsClientId: index("idx_invitation_guests_client_id").on(table.clientId),
		idxInvitationGuestsEventId: index("idx_invitation_guests_event_id").on(table.eventId),
		idxInvitationGuestsGuestCode: index("idx_invitation_guests_guest_code").on(table.guestCode),
		idxInvitationGuestsIsCheckedIn: index("idx_invitation_guests_is_checked_in").on(table.isCheckedIn),
		idxInvitationGuestsGuestType: index("idx_invitation_guests_guest_type").on(table.guestTypeId),
		idxInvitationGuestsSeatingConfig: index("idx_invitation_guests_seating_config").on(table.seatingConfigId),
		idxInvitationGuestsGuestGroup: index("idx_invitation_guests_guest_group").on(table.guestGroup),
		idxInvitationGuestsEventGroup: index("idx_invitation_guests_event_group").on(table.eventId, table.guestGroup),
		idxGuestsInvitation: index("idx_guests_invitation").on(table.invitationId),
		idxGuestsCheckin: index("idx_guests_checkin").on(table.invitationId, table.isCheckedIn),
		invitationGuestsGuestCodeKey: unique("invitation_guests_guest_code_key").on(table.guestCode),
	}
});

export const guestbookStaff = pgTable("guestbook_staff", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	eventId: uuid("event_id").references(() => guestbookEvents.id, { onDelete: "cascade" } ),
	username: varchar("username", { length: 100 }).notNull(),
	passwordEncrypted: text("password_encrypted").notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 50 }),
	canCheckin: boolean("can_checkin").default(false),
	canRedeemSouvenir: boolean("can_redeem_souvenir").default(false),
	canRedeemSnack: boolean("can_redeem_snack").default(false),
	canAccessVipLounge: boolean("can_access_vip_lounge").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGuestbookStaffClientId: index("idx_guestbook_staff_client_id").on(table.clientId),
		idxGuestbookStaffEventId: index("idx_guestbook_staff_event_id").on(table.eventId),
		idxGuestbookStaffClientUsername: index("idx_guestbook_staff_client_username").on(table.clientId, table.username),
		uniqueStaffUsernamePerClient: unique("unique_staff_username_per_client").on(table.clientId, table.username),
	}
});

export const guestbookCheckins = pgTable("guestbook_checkins", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" } ),
	staffId: uuid("staff_id").references(() => guestbookStaff.id, { onDelete: "set null" } ),
	checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	checkinMethod: varchar("checkin_method", { length: 20 }).notNull(),
	deviceInfo: jsonb("device_info"),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGuestbookCheckinsGuestId: index("idx_guestbook_checkins_guest_id").on(table.guestId),
		idxGuestbookCheckinsStaffId: index("idx_guestbook_checkins_staff_id").on(table.staffId),
		idxGuestbookCheckinsCheckedInAt: index("idx_guestbook_checkins_checked_in_at").on(table.checkedInAt),
		uniqueGuestCheckin: unique("unique_guest_checkin").on(table.guestId),
	}
});

export const guestbookRedemptions = pgTable("guestbook_redemptions", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" } ),
	staffId: uuid("staff_id").references(() => guestbookStaff.id, { onDelete: "set null" } ),
	entitlementType: varchar("entitlement_type", { length: 50 }).notNull(),
	quantity: integer("quantity").default(1),
	redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGuestbookRedemptionsGuestId: index("idx_guestbook_redemptions_guest_id").on(table.guestId),
		idxGuestbookRedemptionsStaffId: index("idx_guestbook_redemptions_staff_id").on(table.staffId),
		idxGuestbookRedemptionsType: index("idx_guestbook_redemptions_type").on(table.entitlementType),
		idxGuestbookRedemptionsRedeemedAt: index("idx_guestbook_redemptions_redeemed_at").on(table.redeemedAt),
	}
});

export const staffLogs = pgTable("staff_logs", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	staffId: uuid("staff_id").notNull().references(() => guestbookStaff.id, { onDelete: "cascade" } ),
	guestId: uuid("guest_id").references(() => guests.id, { onDelete: "cascade" } ),
	actionType: varchar("action_type", { length: 50 }).notNull(),
	actionDetails: jsonb("action_details"),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxStaffLogsStaffId: index("idx_staff_logs_staff_id").on(table.staffId),
		idxStaffLogsGuestId: index("idx_staff_logs_guest_id").on(table.guestId),
		idxStaffLogsCreatedAt: index("idx_staff_logs_created_at").on(table.createdAt),
		idxStaffLogsActionType: index("idx_staff_logs_action_type").on(table.actionType),
	}
});

export const clientStaffQuota = pgTable("client_staff_quota", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	maxStaff: integer("max_staff").default(10),
	staffUsed: integer("staff_used").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		clientStaffQuotaClientIdKey: unique("client_staff_quota_client_id_key").on(table.clientId),
	}
});

export const admins = pgTable("admins", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	username: varchar("username", { length: 255 }).notNull(),
	passwordEncrypted: text("password_encrypted").notNull(),
	email: varchar("email", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxAdminsUsername: index("idx_admins_username").on(table.username),
		adminsUsernameKey: unique("admins_username_key").on(table.username),
	}
});

export const clients = pgTable("clients", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	username: varchar("username", { length: 255 }).notNull(),
	passwordEncrypted: text("password_encrypted").notNull(),
	email: varchar("email", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	quotaPhotos: integer("quota_photos").default(10),
	quotaMusic: integer("quota_music").default(1),
	quotaVideos: integer("quota_videos").default(1),
	messageTemplate: text("message_template"),
	guestbookAccess: boolean("guestbook_access").default(false),
	isPublished: boolean("is_published").default(false),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending'::character varying),
	paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true, mode: 'string' }),
	paymentVerifiedBy: uuid("payment_verified_by").references(() => admins.id),
	emailVerified: boolean("email_verified").default(false),
	emailVerificationToken: text("email_verification_token"),
	emailVerificationTokenExpiresAt: timestamp("email_verification_token_expires_at", { withTimezone: true, mode: 'string' }),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
},
(table) => {
	return {
		idxClientsUsername: index("idx_clients_username").on(table.username),
		idxClientsIsPublished: index("idx_clients_is_published").on(table.isPublished),
		idxClientsPaymentStatus: index("idx_clients_payment_status").on(table.paymentStatus),
		clientsUsernameKey: unique("clients_username_key").on(table.username),
	}
});

export const eventSeatingConfig = pgTable("event_seating_config", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	eventId: uuid("event_id").notNull().references(() => guestbookEvents.id, { onDelete: "cascade" } ),
	seatingType: varchar("seating_type", { length: 20 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	capacity: integer("capacity").default(1),
	allowedGuestTypeIds: uuid("allowed_guest_type_ids").array(),
	positionData: jsonb("position_data"),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxEventSeatingConfigEventId: index("idx_event_seating_config_event_id").on(table.eventId),
		idxEventSeatingConfigType: index("idx_event_seating_config_type").on(table.seatingType),
		idxEventSeatingConfigActive: index("idx_event_seating_config_active").on(table.isActive),
		idxEventSeatingConfigSortOrder: index("idx_event_seating_config_sort_order").on(table.eventId, table.sortOrder),
	}
});

export const benefitCatalog = pgTable("benefit_catalog", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	benefitKey: varchar("benefit_key", { length: 50 }).notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	description: text("description"),
	icon: varchar("icon", { length: 50 }),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxBenefitCatalogSortOrder: index("idx_benefit_catalog_sort_order").on(table.sortOrder),
		benefitCatalogBenefitKeyKey: unique("benefit_catalog_benefit_key_key").on(table.benefitKey),
	}
});

export const addonCatalog = pgTable("addon_catalog", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	price: integer("price").notNull(),
	unit: varchar("unit", { length: 50 }).notNull(),
	category: varchar("category", { length: 50 }),
	description: text("description"),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxAddonsCategory: index("idx_addons_category").on(table.category, table.isActive),
		addonCatalogSlugKey: unique("addon_catalog_slug_key").on(table.slug),
	}
});

export const invitationGreetingSettings = pgTable("invitation_greeting_settings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	sectionKey: varchar("section_key", { length: 50 }).notNull(),
	displayOrder: integer("display_order").default(1).notNull(),
	title: text("title"),
	subtitle: text("subtitle"),
	showBrideName: boolean("show_bride_name").default(false),
	showGroomName: boolean("show_groom_name").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGreetingSectionsRegistration: index("idx_greeting_sections_registration").on(table.displayOrder, table.registrationId),
		uqGreetingSectionKey: unique("uq_greeting_section_key").on(table.registrationId, table.sectionKey),
	}
});

export const orders = pgTable("orders", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	type: varchar("type", { length: 50 }).default('wedding'::character varying),
	title: varchar("title", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	mainDate: date("main_date").notNull(),
	inviterType: varchar("inviter_type", { length: 50 }).default('couple'::character varying),
	inviterData: jsonb("inviter_data").notNull(),
	templateId: integer("template_id").notNull().references(() => templates.id),
	templatePrice: integer("template_price").notNull(),
	addons: jsonb("addons").default([]),
	subtotal: integer("subtotal").notNull(),
	discount: integer("discount").default(0),
	voucherCode: varchar("voucher_code", { length: 50 }),
	total: integer("total").notNull(),
	paymentStatus: varchar("payment_status", { length: 20 }).default('pending'::character varying),
	paymentProofUrl: text("payment_proof_url"),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentBank: varchar("payment_bank", { length: 100 }),
	paymentAccountName: varchar("payment_account_name", { length: 255 }),
	paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true, mode: 'string' }),
	paymentVerifiedBy: uuid("payment_verified_by").references(() => admins.id),
	paymentRejectionReason: text("payment_rejection_reason"),
	status: varchar("status", { length: 20 }).default('draft'::character varying),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxOrdersNumber: index("idx_orders_number").on(table.orderNumber),
		idxOrdersClient: index("idx_orders_client").on(table.clientId),
		idxOrdersSlug: index("idx_orders_slug").on(table.slug),
		idxOrdersStatus: index("idx_orders_status").on(table.paymentStatus, table.status),
		idxOrdersExpires: index("idx_orders_expires").on(table.expiresAt),
		idxOrdersPending: index("idx_orders_pending").on(table.createdAt, table.paymentStatus),
		ordersOrderNumberKey: unique("orders_order_number_key").on(table.orderNumber),
		ordersSlugKey: unique("orders_slug_key").on(table.slug),
	}
});

export const weddingRegistrations = pgTable("wedding_registrations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	slug: varchar("slug", { length: 255 }).notNull(),
	clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" } ),
	eventType: varchar("event_type", { length: 50 }).default('islam'::character varying).notNull(),
	weddingDate: date("wedding_date").notNull(),
	timezone: varchar("timezone", { length: 10 }).default('WIB'::character varying),
	brideName: varchar("bride_name", { length: 100 }).notNull(),
	brideFullName: varchar("bride_full_name", { length: 255 }).notNull(),
	brideFatherName: varchar("bride_father_name", { length: 255 }),
	brideMotherName: varchar("bride_mother_name", { length: 255 }),
	brideInstagram: varchar("bride_instagram", { length: 100 }),
	groomName: varchar("groom_name", { length: 100 }).notNull(),
	groomFullName: varchar("groom_full_name", { length: 255 }).notNull(),
	groomFatherName: varchar("groom_father_name", { length: 255 }),
	groomMotherName: varchar("groom_mother_name", { length: 255 }),
	groomInstagram: varchar("groom_instagram", { length: 100 }),
	event1Title: varchar("event1_title", { length: 100 }).default('Akad Nikah'::character varying),
	event1Date: date("event1_date").notNull(),
	event1StartTime: time("event1_start_time").notNull(),
	event1EndTime: time("event1_end_time"),
	event1VenueName: varchar("event1_venue_name", { length: 255 }),
	event1VenueAddress: text("event1_venue_address"),
	event1VenueCity: varchar("event1_venue_city", { length: 100 }),
	event1VenueProvince: varchar("event1_venue_province", { length: 100 }),
	event1MapsUrl: text("event1_maps_url"),
	event2Title: varchar("event2_title", { length: 100 }).default('Resepsi'::character varying),
	event2Date: date("event2_date"),
	event2StartTime: time("event2_start_time"),
	event2EndTime: time("event2_end_time"),
	event2VenueName: varchar("event2_venue_name", { length: 255 }),
	event2VenueAddress: text("event2_venue_address"),
	event2VenueCity: varchar("event2_venue_city", { length: 100 }),
	event2VenueProvince: varchar("event2_venue_province", { length: 100 }),
	event2MapsUrl: text("event2_maps_url"),
	streamingEnabled: boolean("streaming_enabled").default(false),
	streamingUrl: text("streaming_url"),
	streamingDescription: text("streaming_description"),
	streamingButtonLabel: varchar("streaming_button_label", { length: 100 }).default('Watch Live'::character varying),
	giftRecipientName: varchar("gift_recipient_name", { length: 255 }),
	giftRecipientPhone: varchar("gift_recipient_phone", { length: 20 }),
	giftAddressLine1: text("gift_address_line1"),
	giftAddressLine2: text("gift_address_line2"),
	giftAddressCity: varchar("gift_address_city", { length: 100 }),
	giftAddressProvince: varchar("gift_address_province", { length: 100 }),
	giftAddressPostalCode: varchar("gift_address_postal_code", { length: 10 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxWeddingRegistrationsSlug: index("idx_wedding_registrations_slug").on(table.slug),
		idxWeddingRegistrationsClientId: index("idx_wedding_registrations_client_id").on(table.clientId),
		idxWeddingRegistrationsWeddingDate: index("idx_wedding_registrations_wedding_date").on(table.weddingDate),
		weddingRegistrationsSlugKey: unique("wedding_registrations_slug_key").on(table.slug),
	}
});

export const invitationLoveStoryContent = pgTable("invitation_love_story_content", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	title: varchar("title", { length: 255 }).notNull(),
	bodyText: text("body_text").notNull(),
	storyDate: date("story_date"),
	displayOrder: integer("display_order").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxLoveStoryBlocksRegistration: index("idx_love_story_blocks_registration").on(table.displayOrder, table.registrationId),
	}
});

export const gallerySettings = pgTable("gallery_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	mainTitle: varchar("main_title", { length: 255 }).default('Our Moments'::character varying),
	backgroundColor: varchar("background_color", { length: 50 }).default('#F5F5F0'::character varying),
	showYoutube: boolean("show_youtube").default(false),
	youtubeEmbedUrl: text("youtube_embed_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	images: text("images").array(),
	isEnabled: boolean("is_enabled").default(true),
});

export const templates = pgTable("templates", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	category: varchar("category", { length: 50 }).notNull(),
	basePrice: integer("base_price").notNull(),
	description: text("description"),
	features: jsonb("features").default({}),
	thumbnailUrl: text("thumbnail_url"),
	previewUrl: text("preview_url"),
	demoSlug: varchar("demo_slug", { length: 255 }),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxTemplatesCategory: index("idx_templates_category").on(table.category, table.isActive),
		idxTemplatesActive: index("idx_templates_active").on(table.isActive, table.sortOrder),
		templatesSlugKey: unique("templates_slug_key").on(table.slug),
	}
});

export const weddingGiftBankAccounts = pgTable("wedding_gift_bank_accounts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	bankName: varchar("bank_name", { length: 100 }).notNull(),
	accountNumber: varchar("account_number", { length: 50 }).notNull(),
	accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(),
	displayOrder: integer("display_order").default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGiftBankAccountsRegistration: index("idx_gift_bank_accounts_registration").on(table.displayOrder, table.registrationId),
	}
});

export const invoices = pgTable("invoices", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" } ),
	clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" } ),
	invoiceDate: date("invoice_date").default(CURRENT_DATE).notNull(),
	dueDate: date("due_date"),
	subtotal: integer("subtotal").notNull(),
	discount: integer("discount").default(0),
	total: integer("total").notNull(),
	paymentStatus: varchar("payment_status", { length: 20 }).default('unpaid'::character varying),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	pdfUrl: text("pdf_url"),
	pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true, mode: 'string' }),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxInvoicesOrder: index("idx_invoices_order").on(table.orderId),
		idxInvoicesClient: index("idx_invoices_client").on(table.clientId),
		idxInvoicesNumber: index("idx_invoices_number").on(table.invoiceNumber),
		idxInvoicesStatus: index("idx_invoices_status").on(table.paymentStatus),
		idxInvoicesDate: index("idx_invoices_date").on(table.invoiceDate),
		invoicesInvoiceNumberKey: unique("invoices_invoice_number_key").on(table.invoiceNumber),
	}
});

export const themeSettings = pgTable("theme_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	themeKey: varchar("theme_key", { length: 100 }).default('premium/simple1'::character varying),
	customImages: jsonb("custom_images"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	enableGallery: boolean("enable_gallery").default(true),
	enableLoveStory: boolean("enable_love_story").default(true),
	enableWeddingGift: boolean("enable_wedding_gift").default(true),
	enableWishes: boolean("enable_wishes").default(true),
	enableClosing: boolean("enable_closing").default(true),
	customCss: text("custom_css"),
});

export const guestbookAddons = pgTable("guestbook_addons", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	invitationId: uuid("invitation_id").notNull().references(() => invitationPages.id, { onDelete: "cascade" } ),
	orderId: uuid("order_id").references(() => orders.id),
	isEnabled: boolean("is_enabled").default(false),
	enabledAt: timestamp("enabled_at", { withTimezone: true, mode: 'string' }),
	disabledAt: timestamp("disabled_at", { withTimezone: true, mode: 'string' }),
	paymentVerified: boolean("payment_verified").default(false),
	paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true, mode: 'string' }),
	paymentVerifiedBy: uuid("payment_verified_by").references(() => admins.id),
	paymentAmount: integer("payment_amount"),
	paymentProofUrl: text("payment_proof_url"),
	seatingMode: varchar("seating_mode", { length: 20 }).default('no_seat'::character varying),
	staffQuota: integer("staff_quota").default(2),
	staffQuotaUsed: integer("staff_quota_used").default(0),
	config: jsonb("config").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxGuestbookAddonsInvitation: index("idx_guestbook_addons_invitation").on(table.invitationId),
		idxGuestbookAddonsEnabled: index("idx_guestbook_addons_enabled").on(table.isEnabled),
		idxGuestbookAddonsOrder: index("idx_guestbook_addons_order").on(table.orderId),
		guestbookAddonsInvitationIdKey: unique("guestbook_addons_invitation_id_key").on(table.invitationId),
	}
});

export const invitationPages = pgTable("invitation_pages", {
	id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	slug: text("slug").notNull(),
	profile: jsonb("profile").notNull(),
	bride: jsonb("bride").notNull(),
	groom: jsonb("groom").notNull(),
	event: jsonb("event").notNull(),
	greetings: jsonb("greetings").notNull(),
	eventDetails: jsonb("event_details").notNull(),
	loveStory: jsonb("love_story").notNull(),
	gallery: jsonb("gallery").notNull(),
	weddingGift: jsonb("wedding_gift").notNull(),
	closing: jsonb("closing").notNull(),
	musicSettings: jsonb("music_settings"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	themeKey: text("theme_key").default('parallax/parallax-custom1'),
	customImages: jsonb("custom_images"),
	clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" } ),
	verificationStatus: varchar("verification_status", { length: 20 }).default('pending'::character varying),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	verifiedBy: uuid("verified_by").references(() => admins.id),
	activeUntil: date("active_until"),
	isActive: boolean("is_active").default(true),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	orderId: uuid("order_id").references(() => orders.id),
},
(table) => {
	return {
		idxInvitationPagesClientId: index("idx_invitation_pages_client_id").on(table.clientId),
		idxInvitationContentsSlug: index("idx_invitation_contents_slug").on(table.slug),
		idxInvitationPagesActive: index("idx_invitation_pages_active").on(table.activeUntil, table.isActive),
		idxInvitationPagesVerification: index("idx_invitation_pages_verification").on(table.verificationStatus),
		idxInvitationPagesOrder: index("idx_invitation_pages_order").on(table.orderId),
		idxInvitationPagesExpiring: index("idx_invitation_pages_expiring").on(table.activeUntil),
		invitationContentsSlugKey: unique("invitation_contents_slug_key").on(table.slug),
	}
});

export const loveStorySettings = pgTable("love_story_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	mainTitle: varchar("main_title", { length: 255 }).default('Our Love Story'::character varying),
	backgroundImageUrl: text("background_image_url"),
	overlayOpacity: numeric("overlay_opacity", { precision: 3, scale:  2 }).default('0.60'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isEnabled: boolean("is_enabled").default(true),
});

export const weddingGiftSettings = pgTable("wedding_gift_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	title: varchar("title", { length: 255 }).default('Wedding Gift'::character varying),
	subtitle: text("subtitle").default('Doa restu Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi hadiah, dapat melalui:'),
	buttonLabel: varchar("button_label", { length: 100 }).default('Kirim Hadiah'::character varying),
	giftImageUrl: text("gift_image_url"),
	backgroundOverlayOpacity: numeric("background_overlay_opacity", { precision: 3, scale:  2 }).default('0.55'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	recipientName: text("recipient_name"),
	recipientPhone: text("recipient_phone"),
	recipientAddressLine1: text("recipient_address_line1"),
	recipientAddressLine2: text("recipient_address_line2"),
	recipientAddressLine3: text("recipient_address_line3"),
	isEnabled: boolean("is_enabled").default(true),
});

export const backgroundMusicSettings = pgTable("background_music_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	title: varchar("title", { length: 255 }),
	artist: varchar("artist", { length: 255 }),
	loop: boolean("loop").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	audioUrl: text("audio_url"),
	registerAsBackgroundAudio: boolean("register_as_background_audio").default(true),
	isEnabled: boolean("is_enabled").default(true),
});

export const closingSettings = pgTable("closing_settings", {
	registrationId: uuid("registration_id").primaryKey().notNull().references(() => weddingRegistrations.id, { onDelete: "cascade" } ),
	backgroundColor: varchar("background_color", { length: 50 }).default('#F5F5F0'::character varying),
	photoUrl: text("photo_url"),
	namesDisplay: varchar("names_display", { length: 255 }),
	messageLine1: text("message_line1").default('Kami sangat menantikan kehadiran Anda untuk berbagi kebahagiaan di hari istimewa kami.'),
	messageLine2: text("message_line2").default('Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	photoAlt: text("photo_alt").default('Closing Photo'),
	isEnabled: boolean("is_enabled").default(true),
	messageLine3: text("message_line3"),
});