-- ══════════════════════════════════════════
--  PERFORMANCE INDEX — venue listing without sport filter
-- ══════════════════════════════════════════

-- Dedicated index for the common case: status-only filter + created_at sort
CREATE INDEX IF NOT EXISTS idx_venues_status_created
    ON venues(status, created_at DESC);
