-- Rebuild UserRole enum and promote existing ADMIN users to SUPER_ADMIN.

CREATE TYPE "UserRole_new" AS ENUM ('VISITOR', 'MEMBER', 'ADMIN', 'SUPER_ADMIN');

ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "user"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN ("role"::text = 'ADMIN') THEN 'SUPER_ADMIN'
      ELSE "role"::text
    END
  )::"UserRole_new";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'VISITOR'::"UserRole";
