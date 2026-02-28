-- CreateEnum NotificationType
CREATE TYPE "NotificationType" AS ENUM ('JOIN_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'GROUP_FORMED', 'NEW_MESSAGE', 'MEMBER_LEFT');

-- AlterTable Notification: change type from TEXT to NotificationType
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType" USING "type"::"NotificationType";
