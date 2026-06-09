-- ══════════════════════════════════════════
--  PERFORMANCE INDEXES
-- ══════════════════════════════════════════

-- Composite index for venue listing (status + sport_type + created_at)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_list
    ON venues(status, sport_type, created_at DESC);

-- Composite index for user booking history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user_date
    ON bookings(user_id, booked_at DESC);

-- Index for sorting bookings by creation date (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_booked_at
    ON bookings(booked_at DESC);

-- Composite index for venue + status + date (mitra revenue)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_venue_status_date
    ON bookings(venue_id, status, booked_at) WHERE status = 'completed';

-- Composite index for user role listing (admin)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created
    ON users(role, created_at DESC);

-- Composite index for mitra withdrawals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawals_mitra_created
    ON withdrawals(mitra_id, created_at DESC);

-- Composite index for reviews by venue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_venue_created
    ON reviews(venue_id, created_at DESC);
