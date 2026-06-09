-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration v1.19: Seed Reviews with Sample Bookings         ║
-- ║  Guarantees min 1 review per venue                          ║
-- ╚══════════════════════════════════════════════════════════════╝

DO $$
DECLARE
  v RECORD;
  c RECORD;
  slot_id UUID;
  booking_id UUID;
  user_list UUID[];
  selected_user UUID;
  slot_date DATE := CURRENT_DATE + INTERVAL '3 days';
  review_comments TEXT[];
  review_text TEXT;
  rating_val INT;
  found_slot RECORD;
  court_idx INT;
  slot_count INT := 0;
  booking_count INT := 0;
  review_count INT := 0;
BEGIN

  review_comments := ARRAY[
    'Tempatnya bagus, lapangan bersih dan terawat. Recommended!',
    'Lapangan nyaman, pencahayaan bagus. Sayang parkir agak sempit.',
    'Fasilitas lengkap, harga terjangkau. Cocok buat main santai.',
    'Courts nya premium banget! View keren, bakal balik lagi.',
    'Pelayanan ramah, lapangan standar turnamen. Mantap!',
    'Suasananya asik, ada kafenya juga. Nyaman banget.',
    'Booking gampang, staff bantu banget. Lapangan bagus!',
    'Worth it banget buat harganya. Sering main disini.',
    'Tempatnya strategis, gampang dicari. Lapangan oke.',
    'Best court in town! Fasilitas lengkap, staff ramah.'
  ];

  -- Ambil user ID asli dari database (role = 'user')
  user_list := ARRAY(SELECT id FROM users WHERE role = 'user' ORDER BY created_at);
  IF array_length(user_list, 1) IS NULL OR array_length(user_list, 1) = 0 THEN
    RAISE EXCEPTION 'Tidak ada user dg role user di database';
  END IF;

  -- Reset venue review counters (seed data punya angka fixed)
  UPDATE venues SET review_count = 0, rating_avg = 0;

  FOR v IN (SELECT id, name FROM venues ORDER BY id) LOOP
    court_idx := 0;

    FOR c IN (SELECT id, name FROM courts WHERE venue_id = v.id ORDER BY id) LOOP
      court_idx := court_idx + 1;

      -- Court pertama: wajib. Sisanya: 50% random.
      IF court_idx > 1 AND random() < 0.5 THEN
        CONTINUE;
      END IF;

      selected_user := user_list[1 + (random() * (array_length(user_list, 1) - 1))::int];

      -- Cari slot available untuk court & date ini
      SELECT id INTO found_slot FROM slots
      WHERE court_id = c.id AND date = slot_date AND status = 'available'
      LIMIT 1;

      IF NOT FOUND THEN
        slot_id := gen_random_uuid();
        BEGIN
          INSERT INTO slots (id, court_id, date, start_time, end_time, status)
          VALUES (
            slot_id, c.id, slot_date,
            make_time(6 + (random() * 14)::int, 0, 0),
            make_time(7 + (random() * 14)::int, 0, 0),
            'booked'
          );
        EXCEPTION WHEN unique_violation THEN
          -- Slot udah ada, skip aja
          CONTINUE;
        END;
      ELSE
        slot_id := found_slot.id;
        UPDATE slots SET status = 'booked' WHERE id = slot_id;
      END IF;
      slot_count := slot_count + 1;

      booking_id := gen_random_uuid();
      INSERT INTO bookings (id, idempotency_key, user_id, slot_id, court_id, venue_id,
        gross_amount, admin_fee, mitra_payout, status, verification_code, booked_at, confirmed_at, completed_at)
      VALUES (
        booking_id,
        'seed-' || replace(gen_random_uuid()::text, '-', ''),
        selected_user, slot_id, c.id, v.id,
        100000, 5000, 95000,
        'completed',
        upper(substr(md5(random()::text), 1, 6)),
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
      );
      booking_count := booking_count + 1;

      INSERT INTO payments (id, booking_id, midtrans_order_id, midtrans_txn_id,
        payment_type, payment_method, gross_amount, status, paid_at)
      VALUES (
        gen_random_uuid(), booking_id,
        'TRX-' || replace(gen_random_uuid()::text, '-', ''),
        'TXN-' || replace(gen_random_uuid()::text, '-', ''),
        'qris', 'QRIS', 105000, 'settlement',
        NOW() - INTERVAL '2 days'
      );

      rating_val := 3 + (random() * 2)::int;
      review_text := review_comments[1 + (random() * (array_length(review_comments, 1) - 1))::int];
      INSERT INTO reviews (id, booking_id, user_id, venue_id, rating, comment, created_at)
      VALUES (
        gen_random_uuid(), booking_id, selected_user, v.id,
        rating_val, review_text,
        NOW() - INTERVAL '1 day'
      );
      review_count := review_count + 1;

    END LOOP;

    UPDATE venues SET
      review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = v.id),
      rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE venue_id = v.id), 0)
    WHERE id = v.id;

  END LOOP;

  RAISE NOTICE 'Created % slots, % bookings, % reviews', slot_count, booking_count, review_count;
END $$;
