-- AlterTable Notification: add title, rename payload -> data (nullable)
ALTER TABLE "Notification" ADD COLUMN "title" TEXT DEFAULT '';
UPDATE "Notification" SET "title" = COALESCE(("payload"->>'title')::text, 'Notification') WHERE "title" = '' OR "title" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Notification" RENAME COLUMN "payload" TO "data";
ALTER TABLE "Notification" ALTER COLUMN "data" DROP NOT NULL;
