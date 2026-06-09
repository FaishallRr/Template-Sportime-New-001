-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration v1.18: Fix venue image URLs (real Unsplash IDs) ║
-- ╚══════════════════════════════════════════════════════════════╝

UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/JP1ZS_pf1ls/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000001';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/CQOMvcNyKLQ/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000002';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/_KCxzQi961E/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000003';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/9ckhCcL3LuM/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000004';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/MWrHPOOv8xQ/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000005';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/B5CoiKiHJ3U/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000006';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/a1a98q9UvEE/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000007';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/i6T0b-l8uD4/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000008';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/9blUrYkUwaw/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-000000000009';
UPDATE venues SET image_urls = ARRAY['https://unsplash.com/photos/V2j5yh2tuwQ/download?force=true'] WHERE id = 'a0000001-0000-0000-0000-00000000000a';
