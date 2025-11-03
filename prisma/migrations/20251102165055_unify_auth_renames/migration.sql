-- SESSION: rename sessionToken -> token (only if the old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'session' AND column_name = 'sessionToken'
  ) THEN
    ALTER TABLE "session" RENAME COLUMN "sessionToken" TO "token";
  END IF;
END $$;

-- Drop old unique index on session.sessionToken if it exists, then create on token
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = 'session_sessionToken_key'
  ) THEN
    DROP INDEX "session_sessionToken_key";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session" ("token");

-- VERIFICATION: rename token -> value (only if the old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'verification' AND column_name = 'token'
  ) THEN
    ALTER TABLE "verification" RENAME COLUMN "token" TO "value";
  END IF;
END $$;

-- (Optional) ACCOUNT: if you also want this migration to be the single source of truth for provider columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'account' AND column_name = 'provider'
  ) THEN
    ALTER TABLE "account" RENAME COLUMN "provider" TO "providerId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'account' AND column_name = 'providerAccountId'
  ) THEN
    ALTER TABLE "account" RENAME COLUMN "providerAccountId" TO "accountId";
  END IF;
END $$;

-- Ensure composite unique index on (providerId, accountId)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND indexname IN (
       'account_provider_providerAccountId_key',
       'account_provider_provideraccountid_key'
     )
  ) THEN
    -- best-effort: drop either legacy index name if present
    BEGIN
      DROP INDEX "account_provider_providerAccountId_key";
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;

    BEGIN
      DROP INDEX "account_provider_provideraccountid_key";
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key"
  ON "account" ("providerId","accountId");
