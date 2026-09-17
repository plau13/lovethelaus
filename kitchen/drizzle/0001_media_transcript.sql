ALTER TABLE "recipe_media" ADD COLUMN "transcript" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_media" ADD COLUMN "transcribed_at" timestamp with time zone;