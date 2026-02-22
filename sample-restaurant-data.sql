-- Sample restaurant data for L'Osteria
-- Insert this into Supabase to test V2 API

-- Insert L'Osteria restaurant
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
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  primary_color = EXCLUDED.primary_color,
  accent_color = EXCLUDED.accent_color,
  font_family = EXCLUDED.font_family,
  languages = EXCLUDED.languages,
  default_language = EXCLUDED.default_language;