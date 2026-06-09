-- ══════════════════════════════════════════
--  TRIPAY & PROMO CODE FIELDS
-- ══════════════════════════════════════════

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tripay_reference VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_bookings_tripay ON bookings(tripay_reference);
