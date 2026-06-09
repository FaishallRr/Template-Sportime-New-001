DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_format') THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_format CHECK (phone ~ '^[0-9]{10,15}$');
  END IF;
END $$;
