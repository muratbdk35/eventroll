ALTER TABLE "events" ADD COLUMN "album_ready_mail_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "reminder3_mail_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "reminder1_mail_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "purged_at" timestamp with time zone;