-- Migrate existing L'Osteria data to multi-tenant structure (BATCH VERSION)
-- Run this step by step to avoid timeouts

-- STEP 1: Create restaurants table and insert L'Osteria
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
  'c1cbea71-ece5-4d63-bb12-fe06b03d1140',
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