-- Migrate existing L'Osteria data to multi-tenant structure
-- Run this on the production Supabase database

-- 1. First ensure the restaurants table exists (if not already created)
CREATE TABLE IF NOT EXISTS restaurants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#861b2d',
  accent_color    TEXT NOT NULL DEFAULT '#f7f2e6',
  font_family     TEXT NOT NULL DEFAULT 'Poppins',
  languages       TEXT[] NOT NULL DEFAULT ARRAY['nl','fr','en'],
  default_language TEXT NOT NULL DEFAULT 'nl',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Insert L'Osteria restaurant (using the existing category ID as restaurant ID for simplicity)
INSERT INTO restaurants (
  id,
  slug,
  name,
  address,
  phone,
  email,
  primary_color,
  accent_color,
  font_family,
  languages,
  default_language
) VALUES (
  'c1cbea71-ece5-4d63-bb12-fe06b03d1140',  -- Use same UUID as main category for consistency
  'losteria',
  'L''Osteria Deerlijk',
  'Stationsstraat 232, 8540 Deerlijk',
  '+32 (0) 56 25 63 83',
  'info@losteria-deerlijk.be',
  '#861b2d',
  '#f7f2e6', 
  'Poppins',
  ARRAY['nl', 'fr', 'en', 'it'],
  'nl'
) ON CONFLICT (id) DO NOTHING;

-- 3. Add restaurant_id column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

-- 4. Add restaurant_id column to menu_items table if it doesn't exist  
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

-- 5. Update existing categories to belong to L'Osteria restaurant
UPDATE categories 
SET restaurant_id = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
WHERE restaurant_id IS NULL;

-- 6. Update existing menu_items to belong to L'Osteria restaurant
UPDATE menu_items 
SET restaurant_id = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
WHERE restaurant_id IS NULL;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items (restaurant_id);