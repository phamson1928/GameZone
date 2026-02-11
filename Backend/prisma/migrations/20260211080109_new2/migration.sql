-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneContactMethod" DROP CONSTRAINT "ZoneContactMethod_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneJoinRequest" DROP CONSTRAINT "ZoneJoinRequest_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneTagRelation" DROP CONSTRAINT "ZoneTagRelation_tagId_fkey";

-- DropForeignKey
ALTER TABLE "ZoneTagRelation" DROP CONSTRAINT "ZoneTagRelation_zoneId_fkey";

-- CreateIndex
CREATE INDEX "Zone_title_idx" ON "Zone"("title");

-- CreateIndex
CREATE INDEX "Zone_ownerId_idx" ON "Zone"("ownerId");

-- CreateIndex
CREATE INDEX "Zone_gameId_idx" ON "Zone"("gameId");

-- CreateIndex
CREATE INDEX "Zone_status_idx" ON "Zone"("status");

-- CreateIndex
CREATE INDEX "Zone_createdAt_idx" ON "Zone"("createdAt");

-- AddForeignKey
ALTER TABLE "ZoneTagRelation" ADD CONSTRAINT "ZoneTagRelation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneTagRelation" ADD CONSTRAINT "ZoneTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ZoneTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneContactMethod" ADD CONSTRAINT "ZoneContactMethod_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneJoinRequest" ADD CONSTRAINT "ZoneJoinRequest_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
