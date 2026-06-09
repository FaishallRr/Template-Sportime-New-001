-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration v1.17: Professional Reseed - Real Semarang Data  ║
-- ║  10 Venues · 5 Sports · HD Images                          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. Hapus data seed lama (demo accounts tetap) ──
DELETE FROM reviews;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM slots;
DELETE FROM courts;
DELETE FROM venues;
DELETE FROM promo_codes;
DELETE FROM withdrawals;

-- ═══════════════════════════════════════
-- PADEL (3 venues, 8 courts)
-- ═══════════════════════════════════════

-- Super Padel — 4 courts, Rp120rb/jam, 06:00-22:00
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000001', 'super-padel',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Super Padel',
  'Jl. Brigjen Sudiarto No. 127, Gayamsari, Semarang',
  -7.0078000, 110.4589000,
  'Venue padel premium dengan 4 lapangan full panoramic glass, pencahayaan LED, dan area lounge. Tersedia penyewaan raket & bola. Buka setiap hari 06.00 - 22.00 WIB.',
  ARRAY['Parking', 'Shower', 'Equipment Rental', 'WiFi', 'Cafe', 'Lounge'],
  ARRAY['https://unsplash.com/photos/JP1ZS_pf1ls/download?force=true'],
  'active', 4.9, 52, 'padel'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Court 1', 120000, 'active'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Court 2', 120000, 'active'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Court 3', 120000, 'active'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Court 4', 120000, 'active');

-- El Primer Padel — 2 courts, Rp150rb/jam, 06:00-00:00
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000002', 'el-primer-padel',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'El Primer Padel',
  'Jl. Dr. Cipto No. 119, Karangturi, Semarang Timur',
  -6.9902000, 110.4301000,
  'Dua lapangan padel premium dengan full panoramic glass. Buka setiap hari pukul 06.00 - 00.00 WIB. Tersedia penyewaan perlengkapan padel di lokasi.',
  ARRAY['Parking', 'Shower', 'Equipment Rental', 'WiFi', 'Night Lighting'],
  ARRAY['https://unsplash.com/photos/CQOMvcNyKLQ/download?force=true'],
  'active', 5.0, 48, 'padel'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'Court 1', 150000, 'active'),
  ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'Court 2', 150000, 'active');

-- Pickadel Social Court — 2 padel, Rp80rb/jam, 08:00-22:00
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000003', 'pickadel-social-court',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Pickadel Social Court',
  'Jl. Karang Anyar No. 20, Gabahan, Semarang Tengah',
  -6.9703000, 110.4185000,
  'Two Games. One Roof. 2 lapangan padel + 1 pickleball. Dilengkapi Boskaf Coffee Roasters. Tempat nongkrong sambil nonton pertandingan. Buka 08.00 - 22.00 WIB.',
  ARRAY['Parking', 'Cafe', 'WiFi', 'Lounge', 'Equipment Rental'],
  ARRAY['https://unsplash.com/photos/_KCxzQi961E/download?force=true'],
  'active', 4.9, 38, 'padel'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'Padel Court A', 80000, 'active'),
  ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'Padel Court B', 80000, 'active');

-- ═══════════════════════════════════════
-- FUTSAL (2 venues, 6 courts)
-- ═══════════════════════════════════════

-- Reham Futsal Arena — 2 courts, Rp100rb/jam, 09:00-00:00
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000004', 'reham-futsal-arena',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Reham Futsal Arena',
  'Jl. Mulawarman Sel. Dalam I, Kramas, Tembalang, Semarang',
  -7.0489000, 110.4367000,
  'Lapangan futsal indoor dengan lantai vinyl berkualitas. Tersedia 2 lapangan dengan sistem pencahayaan penuh. Buka 09.00 - 00.00 WIB.',
  ARRAY['Parking', 'Shower', 'Equipment Rental', 'WiFi', 'Canteen'],
  ARRAY['https://unsplash.com/photos/9ckhCcL3LuM/download?force=true'],
  'active', 4.6, 31, 'futsal'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'Futsal Court 1', 100000, 'active'),
  ('b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'Futsal Court 2', 100000, 'active');

-- Golden Futsal & Badminton — 2 futsal + 4 badminton, multi-sport
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000005', 'golden-futsal-badminton',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Golden Futsal & Badminton',
  'Jl. Subali Raya No. 6, Semarang',
  -6.9856000, 110.4456000,
  'Sport center dengan 2 lapangan futsal indoor dan 4 lapangan badminton berstandar kompetisi. Lantai vinyl premium, pencahayaan LED, dan area parkir luas. Buka 08.00 - 23.00 WIB.',
  ARRAY['Parking', 'Shower', 'Equipment Rental', 'WiFi', 'Canteen', 'Locker'],
  ARRAY['https://unsplash.com/photos/MWrHPOOv8xQ/download?force=true'],
  'active', 4.5, 44, 'futsal'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'Futsal Court 1', 100000, 'active'),
  ('b0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'Futsal Court 2', 100000, 'active'),
  ('b0000004-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'Badminton Court 1', 35000, 'active'),
  ('b0000004-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'Badminton Court 2', 35000, 'active'),
  ('b0000004-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 'Badminton Court 3', 35000, 'active'),
  ('b0000004-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000005', 'Badminton Court 4', 35000, 'active');

-- ═══════════════════════════════════════
-- BASKET (2 venues, 2 courts)
-- ═══════════════════════════════════════

-- Sport Center Miroto — 1 lapangan basket
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000006', 'sport-center-miroto',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Sport Center Miroto',
  'Jl. Miroto Raya, Kec. Semarang Tengah, Kota Semarang',
  -6.9718000, 110.4245000,
  'GOR serbaguna dengan 1 lapangan basket standar. Dilengkapi kamar ganti, ruang tunggu, kamar mandi, dan area parkir. Buka 08.00 - 22.00 WIB.',
  ARRAY['Parking', 'Shower', 'Equipment', 'WiFi', 'Waiting Room'],
  ARRAY['https://unsplash.com/photos/a1a98q9UvEE/download?force=true'],
  'active', 4.3, 22, 'basket'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000003-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'Basket Full Court', 50000, 'active');

-- GOR Jatidiri — 1 court basket
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000007', 'gor-jatidiri',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOR Jatidiri',
  'Jl. Kawi Raya No. 1, Gajahmungkur, Semarang',
  -7.0056000, 110.4103000,
  'Gedung olahraga legendaris Semarang dengan lapangan basket indoor standar FIBA. Lantai kayu parket, pencahayaan optimal, tribun penonton. Buka 07.00 - 21.00 WIB.',
  ARRAY['Parking', 'Shower', 'WiFi', 'Tribune', 'Locker'],
  ARRAY['https://unsplash.com/photos/urKs1s_z42A/download?force=true'],
  'active', 4.7, 18, 'basket'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000003-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'Basket Full Court', 75000, 'active');

-- ═══════════════════════════════════════
-- BADMINTON (2 venues, 5 courts)
-- ═══════════════════════════════════════

-- GOR Badminton Citraland BSB — 2 courts
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000008', 'gor-badminton-citraland',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOR Badminton Citraland BSB',
  'Cluster Forest Hill, CitraLand BSB City, Semarang',
  -7.0534000, 110.3765000,
  'Gedung bulu tangkis dengan 2 lapangan lantai vinyl standar kompetisi. Nyaman, sejuk, dan pencahayaan merata. Buka 08.00 - 22.00 WIB.',
  ARRAY['Parking', 'WiFi', 'Equipment Rental', 'Canteen'],
  ARRAY['https://unsplash.com/photos/i6T0b-l8uD4/download?force=true'],
  'active', 4.7, 26, 'badminton'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000004-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'Court 1', 50000, 'active'),
  ('b0000004-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'Court 2', 50000, 'active');

-- GOR Bulutangkis PLN Gajahmungkur — 3 courts
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-000000000009', 'gor-bulutangkis-pln',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOR Bulutangkis PLN Gajahmungkur',
  'Jl. Gajahmungkur Raya, Gajahmungkur, Semarang',
  -7.0085000, 110.4132000,
  'GOR bulu tangkis dengan 3 lapangan berstandar nasional. Lantai vinyl anti licin, pencahayaan tanpa bayangan, sirkulasi udara baik. Buka 08.00 - 22.00 WIB.',
  ARRAY['Parking', 'Shower', 'Equipment Rental', 'WiFi'],
  ARRAY['https://unsplash.com/photos/9blUrYkUwaw/download?force=true'],
  'active', 4.5, 20, 'badminton'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000004-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000009', 'Court 1', 45000, 'active'),
  ('b0000004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000009', 'Court 2', 45000, 'active'),
  ('b0000004-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000009', 'Court 3', 45000, 'active');

-- ═══════════════════════════════════════
-- VOLI (1 venue, 2 courts)
-- ═══════════════════════════════════════

-- GOR Tri Lomba Juang — 2 courts voli
INSERT INTO venues (id, slug, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES (
  'a0000001-0000-0000-0000-00000000000a', 'gor-tri-lomba-juang',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GOR Tri Lomba Juang',
  'Jl. Ki Mangunsarkoro, Manyaran, Semarang',
  -6.9876000, 110.4012000,
  'Gedung olahraga serbaguna dengan 2 lapangan voli indoor standar nasional. Lantai kayu berkualitas, net standar internasional, pencahayaan optimal. Buka 08.00 - 21.00 WIB.',
  ARRAY['Parking', 'Shower', 'WiFi', 'Tribune', 'Equipment'],
  ARRAY['https://unsplash.com/photos/V2j5yh2tuwQ/download?force=true'],
  'active', 4.6, 14, 'voli'
);
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
  ('b0000005-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-00000000000a', 'Voli Court 1', 50000, 'active'),
  ('b0000005-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-00000000000a', 'Voli Court 2', 50000, 'active');
