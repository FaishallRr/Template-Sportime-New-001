-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration v1.5: Soft Delete + Promo Codes                  ║
-- ║  Created: 2026-04-18                                    ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Add deleted_at column for Soft Delete on venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,
   discount_percent SMALLINT NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    min_booking_amount BIGINT DEFAULT 0,
    max_uses        INTEGER DEFAULT 100,
    current_uses    INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    valid_from      TIMESTAMPTZ DEFAULT NOW(),
    valid_until    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = TRUE;

-- 3. Seed Promo Codes
INSERT INTO promo_codes (code, discount_percent, max_uses, valid_until) VALUES
    ('PADELSPORT', 20, 100, NOW() + INTERVAL '30 days'),
    ('PADELTIME', 15, 200, NOW() + INTERVAL '30 days'),
    ('BARU2026', 25, 50, NOW() + INTERVAL '60 days')
ON CONFLICT (code) DO NOTHING;

-- 4. Update slot_lock_minutes config (for payment expiry)
-- This is used by the Cron Job to determine payment timeout
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 5. Add payment expiry tracking in bookings
-- Will be set when booking is created (locked for 10 minutes)