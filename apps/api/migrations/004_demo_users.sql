-- ================================================================
-- 004_demo_users.sql — Demo accounts for login testing
-- ================================================================

-- Admin: admin@padelpoint.id / Admin@2026
INSERT INTO users (id, email, phone, password_hash, full_name, role, is_verified, verified_at, address)
VALUES (
  'ad000000-0000-0000-0000-000000000001',
  'admin@padelpoint.id',
  '08210000001',
  '$2a$12$WjMlQzmIt/otqN4ZiU4HSuDGw90VEprVEbuf2NDhqNi6a/eG.TcHi',
  'Admin PadelPoint',
  'admin',
  TRUE, NOW(),
  'Jl. Pandanaran No. 1, Semarang 50134'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  address = EXCLUDED.address;

-- Mitra: hadi@padelsemarang.id / Mitra@2026
-- This user already exists with id a1b2c3d4-..., just update password
UPDATE users SET
  password_hash = '$2a$12$fKVU10lgh2U10mJcCaajgea8NyTAiAgoExRS4gonPn1zGB.AOS6ga',
  address = 'Jl. Sultan Agung No. 102, Gajahmungkur, Semarang',
  ktp_number = '3374010101850001'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- User: user@demo.com / User@2026
INSERT INTO users (id, email, phone, password_hash, full_name, role, is_verified, verified_at, address)
VALUES (
  'aa000000-0000-0000-0000-000000000002',
  'user@demo.com',
  '08211234999',
  '$2a$12$gC/BwcvGAf5V4iMaR6sOLexauwQyVrbU/f54yHez9i6Vy.GVpMspy',
  'Demo Pengguna',
  'user',
  TRUE, NOW(),
  'Jl. Pemuda No. 45, Semarang'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  address = EXCLUDED.address;
