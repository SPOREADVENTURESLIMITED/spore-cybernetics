DO $ BEGIN
  CREATE TYPE "VerifiedDocumentStatus" AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $;

CREATE TABLE IF NOT EXISTS "VerifiedDocument" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "verificationCode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "issuerName" TEXT NOT NULL,
  "issuerDepartment" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "documentUrl" TEXT,
  "documentHash" TEXT,
  "status" "VerifiedDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  "revokedAt" TIMESTAMP(3),
  "revocationReason" TEXT,
  "issuedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerifiedDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerifiedDocument_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedDocument_reference_key" ON "VerifiedDocument"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedDocument_verificationCode_key" ON "VerifiedDocument"("verificationCode");
CREATE INDEX IF NOT EXISTS "VerifiedDocument_status_issuedAt_idx" ON "VerifiedDocument"("status", "issuedAt");
CREATE INDEX IF NOT EXISTS "VerifiedDocument_recipientEmail_idx" ON "VerifiedDocument"("recipientEmail");
