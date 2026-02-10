-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "buckettype" AS ENUM('VECTOR', 'ANALYTICS', 'STANDARD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "equality_op" AS ENUM('in', 'gte', 'gt', 'lte', 'lt', 'neq', 'eq');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "action" AS ENUM('ERROR', 'TRUNCATE', 'DELETE', 'UPDATE', 'INSERT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_type" AS ENUM('phone', 'webauthn', 'totp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_status" AS ENUM('verified', 'unverified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "aal_level" AS ENUM('aal3', 'aal2', 'aal1');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "code_challenge_method" AS ENUM('plain', 's256');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "one_time_token_type" AS ENUM('phone_change_token', 'email_change_token_current', 'email_change_token_new', 'recovery_token', 'reauthentication_token', 'confirmation_token');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "oauth_registration_type" AS ENUM('manual', 'dynamic');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "oauth_authorization_status" AS ENUM('expired', 'denied', 'approved', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "oauth_response_type" AS ENUM('code');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "oauth_client_type" AS ENUM('confidential', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation_contents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"slug" text NOT NULL,
	"profile" jsonb NOT NULL,
	"bride" jsonb NOT NULL,
	"groom" jsonb NOT NULL,
	"event" jsonb NOT NULL,
	"greetings" jsonb NOT NULL,
	"event_details" jsonb NOT NULL,
	"love_story" jsonb NOT NULL,
	"gallery" jsonb NOT NULL,
	"wedding_gift" jsonb NOT NULL,
	"closing" jsonb NOT NULL,
	"music_settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"theme_key" text DEFAULT 'parallax/parallax-custom1',
	"custom_images" jsonb,
	CONSTRAINT "invitation_contents_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"invitation_slug" text NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"attendance" text NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation_guests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"sent" boolean DEFAULT false,
	"event_id" uuid,
	"guest_code" varchar(50),
	"qr_code" text,
	"guest_type_id" uuid,
	"source" varchar(20) DEFAULT 'registered'::character varying,
	"max_companions" integer DEFAULT 0,
	"actual_companions" integer DEFAULT 0,
	"table_number" integer,
	"seat_number" varchar(20),
	"seating_area" varchar(100),
	"is_checked_in" boolean DEFAULT false,
	"checked_in_at" timestamp with time zone,
	"notes" text,
	"guest_group" varchar(100),
	"seating_config_id" uuid,
	CONSTRAINT "invitation_guests_guest_code_key" UNIQUE("guest_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"client_id" uuid NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"event_time" time,
	"venue_name" varchar(255),
	"venue_address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"staff_quota" integer DEFAULT 2,
	"staff_quota_used" integer DEFAULT 0,
	"has_invitation" boolean DEFAULT true,
	"has_guestbook" boolean DEFAULT false,
	"invitation_config" jsonb DEFAULT '{}'::jsonb,
	"guestbook_config" jsonb DEFAULT '{}'::jsonb,
	"seating_mode" varchar(20) DEFAULT 'no_seat'::character varying
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_types" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"client_id" uuid NOT NULL,
	"type_name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"color_code" varchar(20),
	"priority_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"event_id" uuid,
	CONSTRAINT "unique_guest_type_per_client_event" UNIQUE("client_id","type_name","event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_type_benefits" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"guest_type_id" uuid NOT NULL,
	"benefit_type" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 1,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guestbook_staff" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"client_id" uuid NOT NULL,
	"event_id" uuid,
	"username" varchar(100) NOT NULL,
	"password_encrypted" text NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"can_checkin" boolean DEFAULT false,
	"can_redeem_souvenir" boolean DEFAULT false,
	"can_redeem_snack" boolean DEFAULT false,
	"can_access_vip_lounge" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_staff_username_per_client" UNIQUE("client_id","username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guestbook_checkins" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"guest_id" uuid NOT NULL,
	"staff_id" uuid,
	"checked_in_at" timestamp with time zone DEFAULT now(),
	"checkin_method" varchar(20) NOT NULL,
	"device_info" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_guest_checkin" UNIQUE("guest_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guestbook_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"guest_id" uuid NOT NULL,
	"staff_id" uuid,
	"entitlement_type" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 1,
	"redeemed_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"staff_id" uuid NOT NULL,
	"guest_id" uuid,
	"action_type" varchar(50) NOT NULL,
	"action_details" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_staff_quota" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"client_id" uuid NOT NULL,
	"max_staff" integer DEFAULT 10,
	"staff_used" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "client_staff_quota_client_id_key" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_encrypted" text NOT NULL,
	"email" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_encrypted" text NOT NULL,
	"email" varchar(255),
	"slug" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"quota_photos" integer DEFAULT 10,
	"quota_music" integer DEFAULT 1,
	"quota_videos" integer DEFAULT 1,
	"message_template" text,
	"guestbook_access" boolean DEFAULT false,
	CONSTRAINT "clients_username_key" UNIQUE("username"),
	CONSTRAINT "clients_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_seating_config" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"event_id" uuid NOT NULL,
	"seating_type" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"capacity" integer DEFAULT 1,
	"allowed_guest_type_ids" uuid[] DEFAULT '{}',
	"position_data" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "benefit_catalog" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"benefit_key" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "benefit_catalog_benefit_key_key" UNIQUE("benefit_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wedding_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"client_id" uuid,
	"event_type" varchar(50) DEFAULT 'islam'::character varying NOT NULL,
	"wedding_date" date NOT NULL,
	"timezone" varchar(10) DEFAULT 'WIB'::character varying,
	"bride_name" varchar(100) NOT NULL,
	"bride_full_name" varchar(255) NOT NULL,
	"bride_father_name" varchar(255),
	"bride_mother_name" varchar(255),
	"bride_instagram" varchar(100),
	"groom_name" varchar(100) NOT NULL,
	"groom_full_name" varchar(255) NOT NULL,
	"groom_father_name" varchar(255),
	"groom_mother_name" varchar(255),
	"groom_instagram" varchar(100),
	"event1_title" varchar(100) DEFAULT 'Akad Nikah'::character varying,
	"event1_date" date NOT NULL,
	"event1_start_time" time NOT NULL,
	"event1_end_time" time,
	"event1_venue_name" varchar(255),
	"event1_venue_address" text,
	"event1_venue_city" varchar(100),
	"event1_venue_province" varchar(100),
	"event1_maps_url" text,
	"event2_title" varchar(100) DEFAULT 'Resepsi'::character varying,
	"event2_date" date,
	"event2_start_time" time,
	"event2_end_time" time,
	"event2_venue_name" varchar(255),
	"event2_venue_address" text,
	"event2_venue_city" varchar(100),
	"event2_venue_province" varchar(100),
	"event2_maps_url" text,
	"streaming_enabled" boolean DEFAULT false,
	"streaming_url" text,
	"streaming_description" text,
	"streaming_button_label" varchar(100) DEFAULT 'Watch Live'::character varying,
	"gift_recipient_name" varchar(255),
	"gift_recipient_phone" varchar(20),
	"gift_address_line1" text,
	"gift_address_line2" text,
	"gift_address_city" varchar(100),
	"gift_address_province" varchar(100),
	"gift_address_postal_code" varchar(10),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "wedding_registrations_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "greeting_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"section_key" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"title" text,
	"subtitle" text,
	"show_bride_name" boolean DEFAULT false,
	"show_groom_name" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_greeting_section_key" UNIQUE("registration_id","section_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "love_story_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body_text" text NOT NULL,
	"story_date" date,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gallery_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"main_title" varchar(255) DEFAULT 'Our Moments'::character varying,
	"background_color" varchar(50) DEFAULT '#F5F5F0'::character varying,
	"show_youtube" boolean DEFAULT false,
	"youtube_embed_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"images" text[] DEFAULT 'RRAY[',
	"is_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wedding_gift_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"account_holder_name" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "theme_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"theme_key" varchar(100) DEFAULT 'premium/simple1'::character varying,
	"custom_images" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"enable_gallery" boolean DEFAULT true,
	"enable_love_story" boolean DEFAULT true,
	"enable_wedding_gift" boolean DEFAULT true,
	"enable_wishes" boolean DEFAULT true,
	"enable_closing" boolean DEFAULT true,
	"custom_css" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "love_story_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"main_title" varchar(255) DEFAULT 'Our Love Story'::character varying,
	"background_image_url" text,
	"overlay_opacity" numeric(3, 2) DEFAULT 0.60,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wedding_gift_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT 'Wedding Gift'::character varying,
	"subtitle" text DEFAULT 'Doa restu Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi hadiah, dapat melalui:',
	"button_label" varchar(100) DEFAULT 'Kirim Hadiah'::character varying,
	"gift_image_url" text,
	"background_overlay_opacity" numeric(3, 2) DEFAULT 0.55,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"recipient_name" text,
	"recipient_phone" text,
	"recipient_address_line1" text,
	"recipient_address_line2" text,
	"recipient_address_line3" text,
	"is_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "background_music_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"artist" varchar(255),
	"loop" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"audio_url" text,
	"register_as_background_audio" boolean DEFAULT true,
	"is_enabled" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "closing_settings" (
	"registration_id" uuid PRIMARY KEY NOT NULL,
	"background_color" varchar(50) DEFAULT '#F5F5F0'::character varying,
	"photo_url" text,
	"names_display" varchar(255),
	"message_line1" text DEFAULT 'Kami sangat menantikan kehadiran Anda untuk berbagi kebahagiaan di hari istimewa kami.',
	"message_line2" text DEFAULT 'Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"photo_alt" text DEFAULT 'Closing Photo',
	"is_enabled" boolean DEFAULT true,
	"message_line3" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_contents_slug" ON "invitation_contents" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_client_media_client_type" ON "client_media" ("client_id","file_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_client_media_uploaded_at" ON "client_media" ("uploaded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wishes_invitation_slug" ON "wishes" ("invitation_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wishes_created_at" ON "wishes" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_client_id" ON "invitation_guests" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_event_id" ON "invitation_guests" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_guest_code" ON "invitation_guests" ("guest_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_is_checked_in" ON "invitation_guests" ("is_checked_in");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_guest_type" ON "invitation_guests" ("guest_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_seating_config" ON "invitation_guests" ("seating_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_guest_group" ON "invitation_guests" ("guest_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_guests_event_group" ON "invitation_guests" ("event_id","guest_group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_client_id" ON "events" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_date" ON "events" ("event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_has_invitation" ON "events" ("has_invitation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_has_guestbook" ON "events" ("has_guestbook");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_seating_mode" ON "events" ("seating_mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_types_client_id" ON "guest_types" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_types_event_id" ON "guest_types" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_types_client_event" ON "guest_types" ("client_id","event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_type_benefits_active" ON "guest_type_benefits" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guest_type_benefits_guest_type" ON "guest_type_benefits" ("guest_type_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_staff_client_id" ON "guestbook_staff" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_staff_event_id" ON "guestbook_staff" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_staff_client_username" ON "guestbook_staff" ("client_id","username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_checkins_guest_id" ON "guestbook_checkins" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_checkins_staff_id" ON "guestbook_checkins" ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_checkins_checked_in_at" ON "guestbook_checkins" ("checked_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_redemptions_guest_id" ON "guestbook_redemptions" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_redemptions_staff_id" ON "guestbook_redemptions" ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_redemptions_type" ON "guestbook_redemptions" ("entitlement_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guestbook_redemptions_redeemed_at" ON "guestbook_redemptions" ("redeemed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_logs_staff_id" ON "staff_logs" ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_logs_guest_id" ON "staff_logs" ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_logs_created_at" ON "staff_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_logs_action_type" ON "staff_logs" ("action_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admins_username" ON "admins" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clients_username" ON "clients" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clients_slug" ON "clients" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_seating_config_event_id" ON "event_seating_config" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_seating_config_type" ON "event_seating_config" ("seating_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_seating_config_active" ON "event_seating_config" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_seating_config_sort_order" ON "event_seating_config" ("event_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_benefit_catalog_sort_order" ON "benefit_catalog" ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wedding_registrations_slug" ON "wedding_registrations" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wedding_registrations_client_id" ON "wedding_registrations" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wedding_registrations_wedding_date" ON "wedding_registrations" ("wedding_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_greeting_sections_registration" ON "greeting_sections" ("display_order","registration_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_love_story_blocks_registration" ON "love_story_blocks" ("display_order","registration_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_bank_accounts_registration" ON "wedding_gift_bank_accounts" ("display_order","registration_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_media" ADD CONSTRAINT "client_media_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitation_guests" ADD CONSTRAINT "fk_client_id" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitation_guests" ADD CONSTRAINT "fk_invitation_guests_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitation_guests" ADD CONSTRAINT "fk_invitation_guests_guest_type" FOREIGN KEY ("guest_type_id") REFERENCES "public"."guest_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitation_guests" ADD CONSTRAINT "fk_invitation_guests_seating_config" FOREIGN KEY ("seating_config_id") REFERENCES "public"."event_seating_config"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "fk_events_client" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_types" ADD CONSTRAINT "fk_guest_types_client" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_types" ADD CONSTRAINT "fk_guest_types_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guest_type_benefits" ADD CONSTRAINT "fk_benefits_guest_type" FOREIGN KEY ("guest_type_id") REFERENCES "public"."guest_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_staff" ADD CONSTRAINT "fk_guestbook_staff_client" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_staff" ADD CONSTRAINT "fk_guestbook_staff_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_checkins" ADD CONSTRAINT "fk_checkins_guest" FOREIGN KEY ("guest_id") REFERENCES "public"."invitation_guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_checkins" ADD CONSTRAINT "fk_checkins_staff" FOREIGN KEY ("staff_id") REFERENCES "public"."guestbook_staff"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_redemptions" ADD CONSTRAINT "fk_redemptions_guest" FOREIGN KEY ("guest_id") REFERENCES "public"."invitation_guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guestbook_redemptions" ADD CONSTRAINT "fk_redemptions_staff" FOREIGN KEY ("staff_id") REFERENCES "public"."guestbook_staff"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_logs" ADD CONSTRAINT "fk_staff_logs_guest" FOREIGN KEY ("guest_id") REFERENCES "public"."invitation_guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_logs" ADD CONSTRAINT "fk_staff_logs_staff" FOREIGN KEY ("staff_id") REFERENCES "public"."guestbook_staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff_quota" ADD CONSTRAINT "fk_staff_quota_client" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "fk_clients_slug" FOREIGN KEY ("slug") REFERENCES "public"."invitation_contents"("slug") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_seating_config" ADD CONSTRAINT "fk_seating_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wedding_registrations" ADD CONSTRAINT "wedding_registrations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "greeting_sections" ADD CONSTRAINT "greeting_sections_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "love_story_blocks" ADD CONSTRAINT "love_story_blocks_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_settings" ADD CONSTRAINT "gallery_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wedding_gift_bank_accounts" ADD CONSTRAINT "wedding_gift_bank_accounts_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "love_story_settings" ADD CONSTRAINT "love_story_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wedding_gift_settings" ADD CONSTRAINT "wedding_gift_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "background_music_settings" ADD CONSTRAINT "background_music_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "closing_settings" ADD CONSTRAINT "closing_settings_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."wedding_registrations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/