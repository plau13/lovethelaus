ALTER TABLE "recipe" ADD COLUMN "cover_photo_id" text;--> statement-breakpoint
ALTER TABLE "recipe_photo" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_cover_photo_id_recipe_photo_id_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "public"."recipe_photo"("id") ON DELETE set null ON UPDATE no action;