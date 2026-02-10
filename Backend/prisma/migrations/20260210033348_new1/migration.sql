-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('PC', 'CONSOLE', 'MOBILE');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "platforms" "Platform" NOT NULL DEFAULT 'PC';
