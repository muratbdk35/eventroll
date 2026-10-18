ALTER TABLE "events" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
-- Four tiers (DECISIONS #55): the old Premium becomes VIP.
UPDATE "events" SET "plan" = 'vip' WHERE "plan" = 'premium';--> statement-breakpoint
UPDATE "orders" SET "plan" = 'vip' WHERE "plan" = 'premium';--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('mini', 'standard', 'pro', 'vip');--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";