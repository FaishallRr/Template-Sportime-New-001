-- Add address field for complete user data
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Add failed login tracking for anti-brute-force
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups on phone
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Add constraint: phone must be numeric 10-15 digits
-- (PostgreSQL does not support IF NOT EXISTS with ADD CONSTRAINT)
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_phone_format 
    CHECK (phone ~ '^[0-9]{10,15}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
