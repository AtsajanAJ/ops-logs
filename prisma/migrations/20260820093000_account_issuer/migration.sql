-- AlterTable
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

-- Backfill any existing rows (fresh installs should have none or few)
UPDATE "account" SET "issuer" = CASE
  WHEN "providerId" = 'credential' THEN 'local:credential'
  ELSE 'local:oauth:' || "providerId"
END
WHERE "issuer" IS NULL;

-- Make required
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");