ALTER TABLE "media" ADD COLUMN "reported_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "report_reason" text;