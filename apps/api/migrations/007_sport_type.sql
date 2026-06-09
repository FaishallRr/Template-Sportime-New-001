-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration v1.7: Add sport_type for multi-sport support     ║
-- ║  Rename from PadelPoint/PadelTime → SportTime               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Add sport_type column to venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS sport_type VARCHAR(20) DEFAULT 'padel'
    CHECK (sport_type IN ('padel', 'futsal', 'basket', 'badminton', 'tennis', 'voli', 'other'));

-- 2. Update existing venue data to set sport_type based on name hints
UPDATE venues SET sport_type = 'padel' WHERE name ILIKE '%padel%' AND sport_type IS NULL;

-- 3. Add more diverse seed venues for different sports
INSERT INTO venues (id, mitra_id, name, address, latitude, longitude, description, facilities, image_urls, status, rating_avg, review_count, sport_type)
VALUES
    ('f1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Semarang Futsal Arena', 'Jl. Pandanaran No. 45, Semarang',
     -6.9708, 110.4185, 'Lapangan futsal indoor dengan lantai vinil standar internasional.',
     ARRAY['Parking', 'Shower', 'WiFi', 'Canteen'], '{}', 'active', 4.6, 35, 'futsal'),

    ('f1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Gajah Mada Futsal Center', 'Jl. Gajah Mada No. 88, Semarang',
     -6.9714, 110.4278, 'Futsal court indoor modern dengan pencahayaan LED penuh.',
     ARRAY['Parking', 'Shower', 'Equipment'], '{}', 'active', 4.4, 22, 'futsal'),

    ('b1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Semarang Basketball Court', 'Jl. Dr. Cipto No. 12, Semarang',
     -6.9820, 110.4105, 'Lapangan basket indoor dengan lantai kayu standar FIBA.',
     ARRAY['Parking', 'Shower', 'WiFi', 'Locker'], '{}', 'active', 4.8, 18, 'basket'),

    ('b1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Pandanaran Basketball Arena', 'Jl. Pandanaran No. 77, Semarang',
     -6.9708, 110.4200, 'Arena basket outdoor dengan ring standar dan pencahayaan malam.',
     ARRAY['Parking', 'WiFi'], '{}', 'active', 4.3, 12, 'basket'),

    ('e1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Semarang Badminton Hall', 'Jl. Imam Bonjol No. 55, Semarang',
     -6.9885, 110.4165, 'Gedung bulu tangkis dengan 6 court dan lantai vinil premium.',
     ARRAY['Parking', 'Shower', 'WiFi', 'Equipment Rental'], '{}', 'active', 4.7, 30, 'badminton'),

    ('e1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'Semarang Volley Arena', 'Jl. Tembang No. 22, Semarang',
     -6.9765, 110.4150, 'Lapangan voli indoor dengan lantai standar dan pencahayaan profesional.',
     ARRAY['Parking', 'Shower', 'WiFi'], '{}', 'active', 4.5, 14, 'voli')
ON CONFLICT (id) DO NOTHING;

-- 4. Add courts for the new sport venues
INSERT INTO courts (id, venue_id, name, price_per_hour, status) VALUES
    -- Futsal courts
    ('cf100001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001', 'Futsal Court 1', 180000, 'active'),
    ('cf100001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000001', 'Futsal Court 2', 180000, 'active'),
    ('cf100002-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000002', 'Futsal Court A', 150000, 'active'),
    ('cf100002-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000002', 'Futsal Court B', 150000, 'active'),
    -- Basketball courts
    ('cb100001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001', 'Basket Full Court', 300000, 'active'),
    ('cb100002-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000002', 'Basket Half Court', 200000, 'active'),
    -- Badminton courts
    ('ce100001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000001', 'Court 1', 80000, 'active'),
    ('ce100001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000001', 'Court 2', 80000, 'active'),
    ('ce100001-0000-0000-0000-000000000003', 'e1000001-0000-0000-0000-000000000001', 'Court 3', 80000, 'active'),
    -- Volley courts
    ('ce100002-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000002', 'Voli Court 1', 120000, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Create index on sport_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_venues_sport_type ON venues(sport_type);