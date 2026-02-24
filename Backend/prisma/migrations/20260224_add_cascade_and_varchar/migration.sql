-- Migration: add_cascade_and_varchar
-- Description:
--   1. Add onDelete: Cascade to GroupMember.groupId -> Group
--   2. Add onDelete: Cascade to Message.groupId -> Group
--   3. Change Message.content from Text to VarChar(2000)

-- Step 1: Drop old FK constraints
ALTER TABLE "GroupMember" DROP CONSTRAINT IF EXISTS "GroupMember_groupId_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_groupId_fkey";

-- Step 2: Re-add with ON DELETE CASCADE
ALTER TABLE "GroupMember"
  ADD CONSTRAINT "GroupMember_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Alter Message.content to VarChar(2000) và xóa isDeleted
ALTER TABLE "Message" ALTER COLUMN "content" TYPE VARCHAR(2000);
ALTER TABLE "Message" DROP COLUMN IF EXISTS "isDeleted";

