-- ============================================================================
-- AdaMenu — Initial Schema Migration
-- ============================================================================
-- Multi-tenant restaurant menu SaaS backed by Supabase.
-- Run with: supabase db push (or via Supabase Dashboard → SQL Editor)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. RESTAURANTS
-- ============================================================================

CREATE TABLE restaurants (
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

CREATE INDEX idx_restaurants_slug ON restaurants (slug) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. RESTAURANT ↔ USER LINK (for auth middleware)
-- ============================================================================

CREATE TABLE restaurant_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'manager', 'staff')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

CREATE INDEX idx_restaurant_users_user ON restaurant_users (user_id);
CREATE INDEX idx_restaurant_users_restaurant ON restaurant_users (restaurant_id);

-- ============================================================================
-- 3. CATEGORIES
-- ============================================================================

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            JSONB NOT NULL DEFAULT '{}',
  icon            TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  visible         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_restaurant ON categories (restaurant_id);
CREATE INDEX idx_categories_sort ON categories (restaurant_id, sort_order);

-- ============================================================================
-- 4. SUBCATEGORIES
-- ============================================================================

CREATE TABLE subcategories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            JSONB NOT NULL DEFAULT '{}',
  sort_order      INT NOT NULL DEFAULT 0,
  visible         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subcategories_category ON subcategories (category_id);
CREATE INDEX idx_subcategories_restaurant ON subcategories (restaurant_id);
CREATE INDEX idx_subcategories_sort ON subcategories (category_id, sort_order);

-- ============================================================================
-- 5. MENU ITEMS
-- ============================================================================

CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id  UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            JSONB NOT NULL DEFAULT '{}',
  description     JSONB NOT NULL DEFAULT '{}',
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  available       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_subcategory ON menu_items (subcategory_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id);
CREATE INDEX idx_menu_items_sort ON menu_items (subcategory_id, sort_order);

-- ============================================================================
-- 6. ALLERGENS
-- ============================================================================

CREATE TABLE allergens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name            JSONB NOT NULL DEFAULT '{}',
  icon            TEXT,
  is_eu_standard  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- restaurant_id IS NULL for EU standard allergens (shared across all restaurants)
CREATE INDEX idx_allergens_restaurant ON allergens (restaurant_id);

-- ============================================================================
-- 7. SIDE DISHES
-- ============================================================================

CREATE TABLE side_dishes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            JSONB NOT NULL DEFAULT '{}',
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_side_dishes_restaurant ON side_dishes (restaurant_id);

-- ============================================================================
-- 8. SUPPLEMENTS
-- ============================================================================

CREATE TABLE supplements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subcategory_id  UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  name            JSONB NOT NULL DEFAULT '{}',
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplements_restaurant ON supplements (restaurant_id);
CREATE INDEX idx_supplements_subcategory ON supplements (subcategory_id);

-- ============================================================================
-- 9. JUNCTION TABLES
-- ============================================================================

CREATE TABLE menu_item_allergens (
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  allergen_id     UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, allergen_id)
);

CREATE INDEX idx_mia_menu_item ON menu_item_allergens (menu_item_id);
CREATE INDEX idx_mia_allergen ON menu_item_allergens (allergen_id);

CREATE TABLE menu_item_side_dishes (
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  side_dish_id    UUID NOT NULL REFERENCES side_dishes(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, side_dish_id)
);

CREATE INDEX idx_misd_menu_item ON menu_item_side_dishes (menu_item_id);
CREATE INDEX idx_misd_side_dish ON menu_item_side_dishes (side_dish_id);

CREATE TABLE menu_item_supplements (
  menu_item_id    UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  supplement_id   UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, supplement_id)
);

CREATE INDEX idx_mis_menu_item ON menu_item_supplements (menu_item_id);
CREATE INDEX idx_mis_supplement ON menu_item_supplements (supplement_id);

-- ============================================================================
-- 10. MENU TEMPLATES (menumaker projects)
-- ============================================================================

CREATE TABLE menu_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  project_json    JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_templates_restaurant ON menu_templates (restaurant_id);

-- ============================================================================
-- 11. UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_side_dishes_updated_at
  BEFORE UPDATE ON side_dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_supplements_updated_at
  BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_menu_templates_updated_at
  BEFORE UPDATE ON menu_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_side_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (our backend uses service role key)
-- These policies allow authenticated users to see their own restaurant data

-- Restaurants: users can read restaurants they belong to
CREATE POLICY "Users can view own restaurants"
  ON restaurants FOR SELECT
  USING (
    id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
    OR deleted_at IS NULL  -- Public info for slug lookups
  );

CREATE POLICY "Users can update own restaurants"
  ON restaurants FOR UPDATE
  USING (
    id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Authenticated users can create restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Restaurant users
CREATE POLICY "Users can view own restaurant memberships"
  ON restaurant_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can manage memberships"
  ON restaurant_users FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Categories: scoped to restaurant
CREATE POLICY "Users can manage own restaurant categories"
  ON categories FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Subcategories: scoped to restaurant
CREATE POLICY "Users can manage own restaurant subcategories"
  ON subcategories FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Menu items: scoped to restaurant
CREATE POLICY "Users can manage own restaurant menu items"
  ON menu_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Allergens: EU standards readable by all authenticated; custom scoped
CREATE POLICY "Anyone can read EU standard allergens"
  ON allergens FOR SELECT
  USING (is_eu_standard = true);

CREATE POLICY "Users can manage own restaurant allergens"
  ON allergens FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Side dishes: scoped to restaurant
CREATE POLICY "Users can manage own restaurant side dishes"
  ON side_dishes FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Supplements: scoped to restaurant
CREATE POLICY "Users can manage own restaurant supplements"
  ON supplements FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Junction tables: allow if user has access to the menu item's restaurant
CREATE POLICY "Users can manage menu item allergens"
  ON menu_item_allergens FOR ALL
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE restaurant_id IN (
        SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage menu item side dishes"
  ON menu_item_side_dishes FOR ALL
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE restaurant_id IN (
        SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage menu item supplements"
  ON menu_item_supplements FOR ALL
  USING (
    menu_item_id IN (
      SELECT id FROM menu_items WHERE restaurant_id IN (
        SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
      )
    )
  );

-- Menu templates: scoped to restaurant
CREATE POLICY "Users can manage own restaurant templates"
  ON menu_templates FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 13. PUBLIC ACCESS POLICIES (for widget / public menu endpoint)
-- ============================================================================
-- The public menu endpoint uses the service role key, but if we want
-- the anon key to work for public menus, we need these policies:

CREATE POLICY "Public can read visible categories"
  ON categories FOR SELECT
  USING (visible = true);

CREATE POLICY "Public can read visible subcategories"
  ON subcategories FOR SELECT
  USING (visible = true);

CREATE POLICY "Public can read available menu items"
  ON menu_items FOR SELECT
  USING (available = true);

CREATE POLICY "Public can read menu item relations"
  ON menu_item_allergens FOR SELECT
  USING (true);

CREATE POLICY "Public can read menu item side dishes"
  ON menu_item_side_dishes FOR SELECT
  USING (true);

CREATE POLICY "Public can read menu item supplements"
  ON menu_item_supplements FOR SELECT
  USING (true);

CREATE POLICY "Public can read side dishes"
  ON side_dishes FOR SELECT
  USING (true);

CREATE POLICY "Public can read supplements"
  ON supplements FOR SELECT
  USING (true);

CREATE POLICY "Public can read non-deleted restaurants"
  ON restaurants FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================================================
-- 14. SEED DATA — EU 14 Standard Allergens
-- ============================================================================

INSERT INTO allergens (id, restaurant_id, name, icon, is_eu_standard) VALUES
  (uuid_generate_v4(), NULL, '{"nl": "Gluten", "fr": "Gluten", "en": "Gluten"}', '🌾', true),
  (uuid_generate_v4(), NULL, '{"nl": "Schaaldieren", "fr": "Crustacés", "en": "Crustaceans"}', '🦐', true),
  (uuid_generate_v4(), NULL, '{"nl": "Eieren", "fr": "Œufs", "en": "Eggs"}', '🥚', true),
  (uuid_generate_v4(), NULL, '{"nl": "Vis", "fr": "Poisson", "en": "Fish"}', '🐟', true),
  (uuid_generate_v4(), NULL, '{"nl": "Pinda''s", "fr": "Arachides", "en": "Peanuts"}', '🥜', true),
  (uuid_generate_v4(), NULL, '{"nl": "Soja", "fr": "Soja", "en": "Soy"}', '🫘', true),
  (uuid_generate_v4(), NULL, '{"nl": "Melk", "fr": "Lait", "en": "Milk"}', '🥛', true),
  (uuid_generate_v4(), NULL, '{"nl": "Noten", "fr": "Fruits à coque", "en": "Tree nuts"}', '🌰', true),
  (uuid_generate_v4(), NULL, '{"nl": "Selderij", "fr": "Céleri", "en": "Celery"}', '🥬', true),
  (uuid_generate_v4(), NULL, '{"nl": "Mosterd", "fr": "Moutarde", "en": "Mustard"}', '🟡', true),
  (uuid_generate_v4(), NULL, '{"nl": "Sesamzaad", "fr": "Graines de sésame", "en": "Sesame"}', '⚪', true),
  (uuid_generate_v4(), NULL, '{"nl": "Sulfiet", "fr": "Sulfites", "en": "Sulphites"}', '🍷', true),
  (uuid_generate_v4(), NULL, '{"nl": "Lupine", "fr": "Lupin", "en": "Lupin"}', '🌸', true),
  (uuid_generate_v4(), NULL, '{"nl": "Weekdieren", "fr": "Mollusques", "en": "Molluscs"}', '🐚', true);
