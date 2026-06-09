-- Migration 006: Fix schema inconsistencies
-- Add missing columns that backend code expects

-- 1. Add booking_code to bookings table (used by GetAllBookings)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(20) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- 2. Add withdrawal_status to bookings (used by GetMitraRevenue)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS withdrawal_status VARCHAR(20);

-- 3. Fix promo_codes column name if it was created with uppercase
-- (PostgreSQL folds unquoted identifiers to lowercase, so this should be fine
-- unless the migration was run with quoted identifiers)
-- If discount_percent column doesn't exist, add it:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promo_codes' AND column_name = 'discount_percent') THEN
        ALTER TABLE promo_codes ADD COLUMN discount_percent SMALLINT NOT NULL DEFAULT 0;
        ALTER TABLE promo_codes ADD COLUMN max_discount BIGINT DEFAULT 0;
    END IF;
END $$;

-- 4. Update existing bookings to have verification_code as booking_code fallback
UPDATE bookings SET booking_code = verification_code WHERE booking_code IS NULL AND verification_code IS NOT NULL;

-- 5. Set default payment_method for existing bookings
UPDATE bookings SET payment_method = 'QRIS' WHERE payment_method IS NULL AND status IN ('confirmed', 'completed');