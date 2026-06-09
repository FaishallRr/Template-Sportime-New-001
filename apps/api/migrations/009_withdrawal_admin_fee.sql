-- Admin withdrawal fee: additional admin commission on mitra withdrawals
-- Configurable via WITHDRAWAL_FEE_PERCENT env var (default 2%)

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount BIGINT;

-- Update existing withdrawals: default admin_fee to 0, net_amount = amount
UPDATE withdrawals
SET admin_fee = 0, net_amount = amount
WHERE admin_fee IS NULL;
