/*
  Warnings:

  - Changed the column `platforms` on the `Game` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
-- First, rename the old column
ALTER TABLE "Game" RENAME COLUMN "platforms" TO "platforms_old";

-- Create new column as array
ALTER TABLE "Game" ADD COLUMN "platforms" "Platform"[] DEFAULT ARRAY[]::"Platform"[];

-- Update new column: convert single value to array (if data exists)
UPDATE "Game" SET "platforms" = ARRAY["platforms_old"]::"Platform"[] WHERE "platforms_old" IS NOT NULL;

-- Drop the old column
ALTER TABLE "Game" DROP COLUMN "platforms_old";

-- Remove default
ALTER TABLE "Game" ALTER COLUMN "platforms" DROP DEFAULT;
