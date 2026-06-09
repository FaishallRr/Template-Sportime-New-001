-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PadelPoint Semarang - Database Schema v1.0                ║
-- ║  PostgreSQL 16 | Created: 2026-04-16                       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════════════════════
--  USERS & AUTHENTICATION
-- ══════════════════════════════════════════

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'mitra', 'admin')),
    is_verified     BOOLEAN DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    ktp_number      VARCHAR(20),
    ktp_photo_url   VARCHAR(500),
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    login_count     INTEGER DEFAULT 0,
    is_suspended    BOOLEAN DEFAULT FALSE,
    suspend_reason  TEXT
);

-- ══════════════════════════════════════════
--  SESSION & TOKEN MANAGEMENT 
-- ══════════════════════════════════════════

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    device      VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ══════════════════════════════════════════
--  AUDIT LOG (Anti-Fraud)
-- ══════════════════════════════════════════

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(50),
    entity_id   VARCHAR(100),
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ══════════════════════════════════════════
--  VENUES
-- ══════════════════════════════════════════

CREATE TABLE venues (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mitra_id     UUID NOT NULL REFERENCES users(id),
    name         VARCHAR(200) NOT NULL,
    address      TEXT NOT NULL,
    latitude     DECIMAL(10,7) NOT NULL,
    longitude    DECIMAL(10,7) NOT NULL,
    description  TEXT,
    facilities   TEXT[],
    image_urls   TEXT[],
    status       VARCHAR(20) DEFAULT 'pending'
                 CHECK (status IN ('pending', 'active', 'suspended')),
    rating_avg   DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_mitra ON venues(mitra_id);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_location ON venues USING GIST (point(longitude, latitude));

-- ══════════════════════════════════════════
--  COURTS
-- ══════════════════════════════════════════

CREATE TABLE courts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id        UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    price_per_hour  BIGINT NOT NULL,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'maintenance', 'closed')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_venue ON courts(venue_id);

-- ══════════════════════════════════════════
--  SLOTS
-- ══════════════════════════════════════════

CREATE TABLE slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id    UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    status      VARCHAR(20) DEFAULT 'available'
                CHECK (status IN ('available', 'locked', 'booked', 'blocked')),
    locked_by   UUID REFERENCES users(id),
    locked_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(court_id, date, start_time)
);

CREATE INDEX idx_slots_court_date ON slots(court_id, date);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_slots_locked ON slots(locked_at) WHERE status = 'locked';

-- ══════════════════════════════════════════
--  BOOKINGS
-- ══════════════════════════════════════════

CREATE TABLE bookings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key   VARCHAR(255) UNIQUE NOT NULL,
    user_id           UUID NOT NULL REFERENCES users(id),
    slot_id           UUID NOT NULL REFERENCES slots(id),
    court_id          UUID NOT NULL REFERENCES courts(id),
    venue_id          UUID NOT NULL REFERENCES venues(id),
    gross_amount      BIGINT NOT NULL,
    admin_fee         BIGINT NOT NULL,
    mitra_payout      BIGINT NOT NULL,
    status            VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'in_progress',
                                        'completed', 'cancelled', 'refunded')),
    verification_code VARCHAR(10) NOT NULL,
    qr_code_url       VARCHAR(500),
    booked_at         TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at      TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    cancelled_at      TIMESTAMPTZ,
    cancel_reason     TEXT
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_venue ON bookings(venue_id);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_idempotency ON bookings(idempotency_key);

-- ══════════════════════════════════════════
--  PAYMENTS (Midtrans)
-- ══════════════════════════════════════════

CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id         UUID NOT NULL REFERENCES bookings(id),
    midtrans_order_id  VARCHAR(100) UNIQUE NOT NULL,
    midtrans_txn_id    VARCHAR(100),
    payment_type       VARCHAR(50),
    payment_method     VARCHAR(50),
    gross_amount       BIGINT NOT NULL,
    status             VARCHAR(30) DEFAULT 'pending'
                       CHECK (status IN ('pending', 'capture', 'settlement',
                                          'deny', 'cancel', 'expire', 'refund')),
    webhook_signature  VARCHAR(255),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    paid_at            TIMESTAMPTZ,
    expired_at         TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_midtrans ON payments(midtrans_order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ══════════════════════════════════════════
--  MITRA SETTINGS
-- ══════════════════════════════════════════

CREATE TABLE mitra_settings (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID UNIQUE NOT NULL REFERENCES users(id),
    bank_name                VARCHAR(50) NOT NULL,
    account_number           VARCHAR(30) NOT NULL,
    account_holder           VARCHAR(150) NOT NULL,
    is_verified              BOOLEAN DEFAULT FALSE,
    verified_at              TIMESTAMPTZ,
    midtrans_sub_account_id  VARCHAR(100),
    wa_number                VARCHAR(20),
    notify_booking           BOOLEAN DEFAULT TRUE,
    notify_payment           BOOLEAN DEFAULT TRUE,
    notify_review            BOOLEAN DEFAULT FALSE,
    notify_daily             BOOLEAN DEFAULT TRUE,
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
--  WITHDRAWALS
-- ══════════════════════════════════════════

CREATE TABLE withdrawals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mitra_id        UUID NOT NULL REFERENCES users(id),
    amount          BIGINT NOT NULL,
    bank_name       VARCHAR(50) NOT NULL,
    account_number  VARCHAR(30) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    processed_by    UUID REFERENCES users(id),
    processed_at    TIMESTAMPTZ,
    reject_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_mitra ON withdrawals(mitra_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ══════════════════════════════════════════
--  REVIEWS
-- ══════════════════════════════════════════

CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID UNIQUE NOT NULL REFERENCES bookings(id),
    user_id     UUID NOT NULL REFERENCES users(id),
    venue_id    UUID NOT NULL REFERENCES venues(id),
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    photo_urls  TEXT[],
    reply_text  TEXT,
    replied_at  TIMESTAMPTZ,
    is_flagged  BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    is_visible  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_venue ON reviews(venue_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = TRUE;

-- ══════════════════════════════════════════
--  SEED: Default Admin Account
-- ══════════════════════════════════════════

-- Password: admin123 (bcrypt hash)
INSERT INTO users (email, phone, password_hash, full_name, role, is_verified, verified_at)
VALUES (
    'admin@padelpoint.id',
    '08001234567',
    '$2a$12$LJ3m4ys3uz0C/hVsqN/Y4eRKP.sVYpgB0mLDq.6u0XT7E6kAyVWaq',
    'Admin PadelPoint',
    'admin',
    TRUE,
    NOW()
);

-- ══════════════════════════════════════════
--  SEED: Demo Mitra + Venues + Courts
-- ══════════════════════════════════════════

-- Password: mitra123 (bcrypt hash)
INSERT INTO users (id, email, phone, password_hash, full_name, role, is_verified, verified_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'hadi@padelcenter.com',
    '08123456789',
    '$2a$12$LJ3m4ys3uz0C/hVsqN/Y4eRKP.sVYpgB0mLDq.6u0XT7E6kAyVWaq',
    'Hadi Gunawan',
    'mitra',
    TRUE,
    NOW()
);

INSERT INTO mitra_settings (user_id, bank_name, account_number, account_holder, is_verified, wa_number)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'BCA',
    '1234567890',
    'HADI GUNAWAN',
    TRUE,
    '08123456789'
);

-- Venue 1: Semarang Padel Center
INSERT INTO venues (id, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count)
VALUES (
    'a1000001-0000-0000-0000-000000000001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Semarang Padel Center',
    'Jl. Sultan Agung No. 102, Gajahmungkur, Semarang',
    -6.9932000,
    110.4203000,
    'Fasilitas padel premium dengan court kaca modern dan pencahayaan LED.',
    ARRAY['Parking', 'Shower', 'Equipment', 'Cafe', 'WiFi'],
    ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBrxWwBgpuw5wh7CRQifZekBiYKTp_-XxzSHEwHjOWw1iWPwCgBvBBsiATVPRK0WiT0jn4VmhQFFq9LDRf6oc3Mxiyx8nNAEif0qbsDXLZ8mECmewm9PDUmrmdh1GQ1Zybeqyjj0nYlFWydSmwH_O0BwQfACBsYqDDmHQy4Ly2E3jEAd4O57r8Fut3o6tUcYNWBzCVrMmXorrvXGCeS_z1V58t5C1uiHkqIz0zPbccOMqWcFec7a5ncCK1FsjzmuMkFfZs8HrMWdoVd'],
    'active',
    4.9,
    42
);

INSERT INTO courts (id, venue_id, name, price_per_hour) VALUES
    ('c1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'Court 1', 250000),
    ('c1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'Court 2', 250000);

-- Venue 2: Skycourt Padel
INSERT INTO venues (id, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count)
VALUES (
    'a1000001-0000-0000-0000-000000000002',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Skycourt Padel',
    'Simpang Lima Area, Semarang',
    -6.9847000,
    110.4180000,
    'Padel court outdoor dengan pemandangan kota Semarang.',
    ARRAY['Parking', 'Shower'],
    ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuDuLqxHTdqKoLGH2E6rEqezfAQVmbtwSW1V4vtJF4m2l1Vpzl4AYnzHMMnb5CKJkW0SSRYEVQZMuFeteBHHhJ_1NNnyhz5pqsnvbXYFqqmKsfCWPUBuYmuHvLw8pERyiQ82ZX7BnwsT1GazZ23yRoyZW6IQ_RBJPOxi_GyHvioceSzCESODFoJO_QoCfWm-DKvy--NiX6Qc66WrFRZ0GbEI9W8-L7lqiU9LZgFAVH6XUVxmfWSa-T2_YeWwY3QtCwXgnsUfnknJkqNN'],
    'active',
    4.7,
    28
);

INSERT INTO courts (id, venue_id, name, price_per_hour) VALUES
    ('c2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000002', 'Court A', 200000),
    ('c2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 'Court B', 200000);

-- Venue 3: Glass Arena Padel
INSERT INTO venues (id, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count)
VALUES (
    'a1000001-0000-0000-0000-000000000003',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Glass Arena Padel',
    'Kawasan Candi Baru, Semarang',
    -7.0051000,
    110.4097000,
    'Arena padel full glass dengan standar internasional.',
    ARRAY['WiFi', 'Bistro', 'Parking', 'Pro Shop'],
    ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuBnr5rt-Q7HG553SVbb_0ATvIgs2Z9BJF3tmc9b6HmremScANNCAtWymiLlHzjTqQsam4ZZCjX_gGwTDSib1XeP-EMsP8wrmA0oqD8LF980qXesOTTIEtUDJUzbsp4B5LleGla1oHs-lEwkd62yjuY3g6oDmUzRQtiX-aoPGULwgiCkuAsangK8t8BhwM1vM02Eur_uNTA1e0xV8qj72d65WsgRuzIiAwFCvu-QoJEM0ibsXZgTbvLguYUvQ-Qu3TID2xkzhQiB5UnR'],
    'active',
    5.0,
    15
);

INSERT INTO courts (id, venue_id, name, price_per_hour) VALUES
    ('c3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003', 'Court 1', 280000),
    ('c3000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000003', 'Court 2', 280000),
    ('c3000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', 'Court 3', 280000);

-- ══════════════════════════════════════════
--  SEED: Demo User
-- ══════════════════════════════════════════

-- Password: user123 (bcrypt hash)
INSERT INTO users (id, email, phone, password_hash, full_name, role, is_verified, verified_at)
VALUES (
    'd1000001-0000-0000-0000-000000000001',
    'robby@email.com',
    '08211234567',
    '$2a$12$LJ3m4ys3uz0C/hVsqN/Y4eRKP.sVYpgB0mLDq.6u0XT7E6kAyVWaq',
    'Robby Setiadi',
    'user',
    TRUE,
    NOW()
);
