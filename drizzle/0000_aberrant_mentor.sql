CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."cost_type" AS ENUM('free', 'sliding_scale', 'subsidized', 'paid');--> statement-breakpoint
CREATE TYPE "public"."language_code" AS ENUM('en', 'fr', 'es', 'pa', 'zh', 'tl', 'ar', 'ur', 'vi', 'uk', 'ti', 'so', 'hi', 'fa');--> statement-breakpoint
CREATE TYPE "public"."need_category" AS ENUM('childcare', 'financial_aid', 'food', 'employment', 'education', 'parenting_support', 'mental_health_support', 'health', 'recreation', 'community_events');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('service', 'program', 'event');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('low', 'medium', 'high', 'crisis');--> statement-breakpoint
CREATE TABLE "intake_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_context_id" uuid,
	"intent" jsonb NOT NULL,
	"urgency" "urgency_level" NOT NULL,
	"crisis_flagged" boolean DEFAULT false NOT NULL,
	"intent_source" text NOT NULL,
	"plan_resource_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "resource_kind" DEFAULT 'service' NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"categories" "need_category"[] NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"location" geometry(point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED NOT NULL,
	"address" text,
	"serves_all_calgary" boolean DEFAULT false NOT NULL,
	"cost_type" "cost_type" NOT NULL,
	"cost_monthly_cad" integer,
	"cost_notes" text,
	"age_min_years" integer,
	"age_max_years" integer,
	"income_tested" boolean DEFAULT false NOT NULL,
	"eligibility_notes" text,
	"languages" "language_code"[] DEFAULT ARRAY['en']::language_code[] NOT NULL,
	"offers_evenings" boolean DEFAULT false NOT NULL,
	"offers_overnight" boolean DEFAULT false NOT NULL,
	"offers_weekends" boolean DEFAULT false NOT NULL,
	"drop_in" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"phone" text,
	"email" text,
	"website" text,
	"source" text NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"is_crisis_resource" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug"),
	CONSTRAINT "resources_lat_range" CHECK ("resources"."lat" BETWEEN 50.5 AND 51.6),
	CONSTRAINT "resources_lng_range" CHECK ("resources"."lng" BETWEEN -114.8 AND -113.5),
	CONSTRAINT "resources_age_range" CHECK ("resources"."age_min_years" IS NULL OR "resources"."age_max_years" IS NULL OR "resources"."age_min_years" <= "resources"."age_max_years"),
	CONSTRAINT "resources_event_has_date" CHECK ("resources"."kind" <> 'event' OR "resources"."starts_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "user_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth0_sub" text NOT NULL,
	"context" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_contexts_auth0_sub_unique" UNIQUE("auth0_sub")
);
--> statement-breakpoint
ALTER TABLE "intake_intents" ADD CONSTRAINT "intake_intents_user_context_id_user_contexts_id_fk" FOREIGN KEY ("user_context_id") REFERENCES "public"."user_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intake_intents_user_idx" ON "intake_intents" USING btree ("user_context_id","created_at");--> statement-breakpoint
CREATE INDEX "resources_location_geog_gix" ON "resources" USING gist (("location"::geography));--> statement-breakpoint
CREATE INDEX "resources_categories_gin" ON "resources" USING gin ("categories");--> statement-breakpoint
CREATE INDEX "resources_starts_at_idx" ON "resources" USING btree ("starts_at");