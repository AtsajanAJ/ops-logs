-- AlterTable
ALTER TABLE "IncidentLog" ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
