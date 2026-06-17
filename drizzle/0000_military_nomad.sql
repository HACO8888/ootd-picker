CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "catalog_extra" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"seasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_override" (
	"catalog_id" text PRIMARY KEY NOT NULL,
	"patch" jsonb NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closet_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text DEFAULT '自訂' NOT NULL,
	"category" text NOT NULL,
	"seasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"moderated_at" bigint,
	"reject_reason" text,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text,
	"date" text NOT NULL,
	"outfit" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "hidden_catalog_item" (
	"user_id" text NOT NULL,
	"catalog_id" text NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	CONSTRAINT "hidden_catalog_item_user_id_catalog_id_pk" PRIMARY KEY("user_id","catalog_id")
);
--> statement-breakpoint
CREATE TABLE "makeup" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "override" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"patch" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	CONSTRAINT "override_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "perfume" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "wear_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"outfit" jsonb NOT NULL,
	"note" text,
	"favorite_id" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closet_item" ADD CONSTRAINT "closet_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_catalog_item" ADD CONSTRAINT "hidden_catalog_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "override" ADD CONSTRAINT "override_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log" ADD CONSTRAINT "wear_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_extra_moderation_idx" ON "catalog_extra" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "closet_item_user_idx" ON "closet_item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "closet_item_user_updated_idx" ON "closet_item" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "closet_item_moderation_idx" ON "closet_item" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "favorite_user_updated_idx" ON "favorite" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "wear_log_user_date_idx" ON "wear_log" USING btree ("user_id","date");