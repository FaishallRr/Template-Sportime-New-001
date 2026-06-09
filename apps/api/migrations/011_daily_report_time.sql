-- Add daily_report_time column to mitra_settings
ALTER TABLE mitra_settings
ADD COLUMN IF NOT EXISTS daily_report_time VARCHAR(5) DEFAULT '21:00';
