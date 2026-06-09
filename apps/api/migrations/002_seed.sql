-- Seed demo user
INSERT INTO users (id, email, phone, password_hash, full_name, role, is_verified, verified_at)
VALUES ('a0a0a0a0-b1b1-c2c2-d3d3-e4e4e4e4e4e4', 'robby@email.com', '08211234567', '$2a$12$LJ3m4ys3uz0C/hVsqN/Y4eRKP.sVYpgB0mLDq.6u0XT7E6kAyVWaq', 'Robby Setiadi', 'user', TRUE, NOW())
ON CONFLICT (email) DO NOTHING;

-- Mitra settings
INSERT INTO mitra_settings (user_id, bank_name, account_number, account_holder, is_verified, wa_number)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'BCA', '1234567890', 'HADI GUNAWAN', TRUE, '08123456789')
ON CONFLICT (user_id) DO NOTHING;

-- Venues
INSERT INTO venues (mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count)
VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Semarang Padel Center', 'Jl. Sultan Agung No. 102, Gajahmungkur, Semarang', -6.9932, 110.4203, 'Fasilitas padel premium dengan court kaca modern.', '{Parking,Shower,Equipment,Cafe,WiFi}', '{}', 'active', 4.9, 42),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Skycourt Padel', 'Simpang Lima Area, Semarang', -6.9847, 110.418, 'Padel court outdoor dengan pemandangan kota.', '{Parking,Shower}', '{}', 'active', 4.7, 28),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Glass Arena Padel', 'Kawasan Candi Baru, Semarang', -7.0051, 110.4097, 'Arena padel full glass standar internasional.', '{WiFi,Bistro,Parking}', '{}', 'active', 5.0, 15);

-- Courts for each venue
INSERT INTO courts (venue_id, name, price_per_hour)
SELECT v.id, c.name, c.price FROM venues v 
CROSS JOIN (VALUES ('Court 1', 250000), ('Court 2', 250000)) AS c(name, price)
WHERE v.name = 'Semarang Padel Center';

INSERT INTO courts (venue_id, name, price_per_hour)
SELECT v.id, c.name, c.price FROM venues v 
CROSS JOIN (VALUES ('Court A', 200000), ('Court B', 200000)) AS c(name, price)
WHERE v.name = 'Skycourt Padel';

INSERT INTO courts (venue_id, name, price_per_hour)
SELECT v.id, c.name, c.price FROM venues v 
CROSS JOIN (VALUES ('Court 1', 280000), ('Court 2', 280000), ('Court 3', 280000)) AS c(name, price)
WHERE v.name = 'Glass Arena Padel';
