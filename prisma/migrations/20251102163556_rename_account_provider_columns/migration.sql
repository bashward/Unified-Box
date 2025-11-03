-- Rename columns
ALTER TABLE "account" RENAME COLUMN "provider" TO "providerId";
ALTER TABLE "account" RENAME COLUMN "providerAccountId" TO "accountId";

-- Drop old unique index if it exists (name may differ on your machine; both drops are safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'account_provider_providerAccountId_key'
  ) THEN
    DROP INDEX "account_provider_providerAccountId_key";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'account_provider_provideraccountid_key'
  ) THEN
    DROP INDEX "account_provider_provideraccountid_key";
  END IF;
END $$;

-- Create the new composite unique index
CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key"
ON "account" ("providerId","accountId");

