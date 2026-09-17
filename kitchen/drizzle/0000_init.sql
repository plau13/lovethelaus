CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"default_servings" integer DEFAULT 4 NOT NULL,
	"preferred_units" text DEFAULT 'us' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"onboarding_answers" text DEFAULT '{}' NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"social_import_count" integer DEFAULT 0 NOT NULL,
	"social_import_period_start" timestamp with time zone,
	"social_import_period_count" integer DEFAULT 0 NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text,
	"current_period_end" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cookbook" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"slug" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"dedication" text DEFAULT '' NOT NULL,
	"family_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cookbook_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cookbook_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cookbook_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"cookbook_id" text NOT NULL,
	"email" text,
	"token" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"invited_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "cookbook_member" (
	"id" text PRIMARY KEY NOT NULL,
	"cookbook_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cookbook_recipe" (
	"id" text PRIMARY KEY NOT NULL,
	"cookbook_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"recipe_id" text,
	"source_url" text NOT NULL,
	"source_type" text NOT NULL,
	"raw_payload" text NOT NULL,
	"title" text NOT NULL,
	"ingredients" text NOT NULL,
	"steps" text NOT NULL,
	"attribution" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_response" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"answers" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_response_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"birth_year" integer,
	"passed_year" integer,
	"photo_key" text,
	"bio" text DEFAULT '' NOT NULL,
	"linked_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"ingredients" text NOT NULL,
	"steps" text NOT NULL,
	"baking_steps" text DEFAULT '' NOT NULL,
	"recipe_type" text DEFAULT 'cooking' NOT NULL,
	"servings" integer,
	"source_type" text DEFAULT 'typed' NOT NULL,
	"source_url" text,
	"source_attribution" text,
	"tags" text DEFAULT '' NOT NULL,
	"category" text,
	"cook_minutes" integer,
	"difficulty" text,
	"slug" text,
	"story" text DEFAULT '' NOT NULL,
	"origin_person_id" text,
	"adapted_from_recipe_id" text,
	"first_made_year" integer,
	"occasion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recipe_collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'view' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_media" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"kind" text NOT NULL,
	"r2_key" text NOT NULL,
	"content_type" text,
	"caption" text DEFAULT '' NOT NULL,
	"duration_seconds" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"user_id" text NOT NULL,
	"made_on" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"media_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_note" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_photo" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"path" text NOT NULL,
	"content_type" text,
	"alt" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"editor_id" text NOT NULL,
	"snapshot" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook" ADD CONSTRAINT "cookbook_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_favorite" ADD CONSTRAINT "cookbook_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_favorite" ADD CONSTRAINT "cookbook_favorite_cookbook_id_cookbook_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_invite" ADD CONSTRAINT "cookbook_invite_cookbook_id_cookbook_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_invite" ADD CONSTRAINT "cookbook_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_member" ADD CONSTRAINT "cookbook_member_cookbook_id_cookbook_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_member" ADD CONSTRAINT "cookbook_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipe" ADD CONSTRAINT "cookbook_recipe_cookbook_id_cookbook_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipe" ADD CONSTRAINT "cookbook_recipe_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_draft" ADD CONSTRAINT "import_draft_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_draft" ADD CONSTRAINT "import_draft_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_response" ADD CONSTRAINT "interview_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_origin_person_id_person_id_fk" FOREIGN KEY ("origin_person_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_adapted_from_recipe_id_recipe_id_fk" FOREIGN KEY ("adapted_from_recipe_id") REFERENCES "public"."recipe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_collaborator" ADD CONSTRAINT "recipe_collaborator_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_collaborator" ADD CONSTRAINT "recipe_collaborator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorite" ADD CONSTRAINT "recipe_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorite" ADD CONSTRAINT "recipe_favorite_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_memory" ADD CONSTRAINT "recipe_memory_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_memory" ADD CONSTRAINT "recipe_memory_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_memory" ADD CONSTRAINT "recipe_memory_media_id_recipe_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."recipe_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_note" ADD CONSTRAINT "recipe_note_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_note" ADD CONSTRAINT "recipe_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_photo" ADD CONSTRAINT "recipe_photo_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_revision" ADD CONSTRAINT "recipe_revision_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_revision" ADD CONSTRAINT "recipe_revision_editor_id_user_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "cookbook_owner_idx" ON "cookbook" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cookbook_visibility_idx" ON "cookbook" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "cookbook_favorite_user_cookbook_key" ON "cookbook_favorite" USING btree ("user_id","cookbook_id");--> statement-breakpoint
CREATE INDEX "cookbook_favorite_cookbook_idx" ON "cookbook_favorite" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "cookbook_invite_cookbook_idx" ON "cookbook_invite" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "cookbook_invite_email_idx" ON "cookbook_invite" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "cookbook_member_cookbook_user_key" ON "cookbook_member" USING btree ("cookbook_id","user_id");--> statement-breakpoint
CREATE INDEX "cookbook_member_user_idx" ON "cookbook_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cookbook_recipe_cookbook_recipe_key" ON "cookbook_recipe" USING btree ("cookbook_id","recipe_id");--> statement-breakpoint
CREATE INDEX "cookbook_recipe_recipe_idx" ON "cookbook_recipe" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "import_draft_user_idx" ON "import_draft" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "person_owner_idx" ON "person" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "recipe_owner_idx" ON "recipe" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "recipe_title_idx" ON "recipe" USING btree ("title");--> statement-breakpoint
CREATE INDEX "recipe_type_idx" ON "recipe" USING btree ("recipe_type");--> statement-breakpoint
CREATE INDEX "recipe_category_idx" ON "recipe" USING btree ("category");--> statement-breakpoint
CREATE INDEX "recipe_cook_minutes_idx" ON "recipe" USING btree ("cook_minutes");--> statement-breakpoint
CREATE INDEX "recipe_difficulty_idx" ON "recipe" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "recipe_updated_at_idx" ON "recipe" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_collaborator_recipe_user_key" ON "recipe_collaborator" USING btree ("recipe_id","user_id");--> statement-breakpoint
CREATE INDEX "recipe_collaborator_user_idx" ON "recipe_collaborator" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_favorite_user_recipe_key" ON "recipe_favorite" USING btree ("user_id","recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_favorite_recipe_idx" ON "recipe_favorite" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_media_key" ON "recipe_media" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "recipe_media_recipe_idx" ON "recipe_media" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_memory_recipe_idx" ON "recipe_memory" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_memory_user_idx" ON "recipe_memory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_note_recipe_idx" ON "recipe_note" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_photo_path_key" ON "recipe_photo" USING btree ("path");--> statement-breakpoint
CREATE INDEX "recipe_photo_recipe_idx" ON "recipe_photo" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_revision_recipe_idx" ON "recipe_revision" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_revision_editor_idx" ON "recipe_revision" USING btree ("editor_id");