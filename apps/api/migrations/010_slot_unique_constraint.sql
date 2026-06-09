-- Prevent duplicate slots: unique constraint on court + date + start_time
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_court_date_time_unique;
ALTER TABLE slots ADD CONSTRAINT slots_court_date_time_unique UNIQUE (court_id, date, start_time);
