-- Venue Slug: URL-friendly names for venue detail pages

ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Generate slugs for existing venues
UPDATE venues SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Handle duplicate slugs by appending first 8 chars of UUID
UPDATE venues v1
SET slug = v1.slug || '-' || SUBSTRING(v1.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM venues v2
  WHERE v2.slug = v1.slug AND v2.id != v1.id
);

-- Make slug NOT NULL after backfilling
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
