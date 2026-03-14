-- ============================================================================
-- Menu Builder — New tables (v2)
-- ============================================================================
-- Completely separate from v1 tables (categories, menu_items, etc.)
-- to avoid breaking the production app.
-- ============================================================================

-- 1. MENUS — per-restaurant menu containers
CREATE TABLE menus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  template_id     TEXT,                    -- frontend template ID (e.g. "tpl-abc123")
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menus_restaurant ON menus (restaurant_id);

CREATE TRIGGER trg_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. MENU_CATEGORIES — categories belonging to a specific menu
CREATE TABLE menu_categories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id             UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  restaurant_id       UUID NOT NULL,
  parent_category_id  UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  hidden              BOOLEAN NOT NULL DEFAULT false,
  display_order       INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_categories_menu ON menu_categories (menu_id);
CREATE INDEX idx_menu_categories_restaurant ON menu_categories (restaurant_id);
CREATE INDEX idx_menu_categories_parent ON menu_categories (parent_category_id);

CREATE TRIGGER trg_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. MENU_CATEGORY_NAMES — multilingual category names
CREATE TABLE menu_category_names (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  language        TEXT NOT NULL,
  name            TEXT NOT NULL,
  UNIQUE (category_id, language)
);

CREATE INDEX idx_menu_category_names_category ON menu_category_names (category_id);

-- 4. MENU_BUILDER_ITEMS — items belonging to a menu category
CREATE TABLE menu_builder_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id         UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL,
  category_id     UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  hidden          BOOLEAN NOT NULL DEFAULT false,
  featured        BOOLEAN NOT NULL DEFAULT false,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_builder_items_menu ON menu_builder_items (menu_id);
CREATE INDEX idx_menu_builder_items_restaurant ON menu_builder_items (restaurant_id);
CREATE INDEX idx_menu_builder_items_category ON menu_builder_items (category_id);

CREATE TRIGGER trg_menu_builder_items_updated_at
  BEFORE UPDATE ON menu_builder_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. MENU_BUILDER_ITEM_NAMES — multilingual item names
CREATE TABLE menu_builder_item_names (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id         UUID NOT NULL REFERENCES menu_builder_items(id) ON DELETE CASCADE,
  language        TEXT NOT NULL,
  name            TEXT NOT NULL,
  UNIQUE (item_id, language)
);

CREATE INDEX idx_menu_builder_item_names_item ON menu_builder_item_names (item_id);

-- 6. MENU_BUILDER_ITEM_DESCRIPTIONS — multilingual item descriptions
CREATE TABLE menu_builder_item_descriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id         UUID NOT NULL REFERENCES menu_builder_items(id) ON DELETE CASCADE,
  language        TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  UNIQUE (item_id, language)
);

CREATE INDEX idx_menu_builder_item_descriptions_item ON menu_builder_item_descriptions (item_id);

-- 7. MENU_BUILDER_ITEM_ALLERGENS — junction: items ↔ allergens (reuse existing allergens table)
CREATE TABLE menu_builder_item_allergens (
  item_id         UUID NOT NULL REFERENCES menu_builder_items(id) ON DELETE CASCADE,
  allergen_id     UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, allergen_id)
);

-- 8. MENU_BUILDER_ITEM_SIDE_DISHES — junction: items ↔ side_dishes (reuse existing)
CREATE TABLE menu_builder_item_side_dishes (
  item_id         UUID NOT NULL REFERENCES menu_builder_items(id) ON DELETE CASCADE,
  side_dish_id    UUID NOT NULL REFERENCES side_dishes(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, side_dish_id)
);

-- 9. MENU_BUILDER_ITEM_SUPPLEMENTS — junction: items ↔ supplements (reuse existing)
CREATE TABLE menu_builder_item_supplements (
  item_id         UUID NOT NULL REFERENCES menu_builder_items(id) ON DELETE CASCADE,
  supplement_id   UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, supplement_id)
);

-- 10. MENU_PAGES — layout pages per menu
CREATE TABLE menu_pages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id         UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  variant_id      TEXT NOT NULL,
  category_ids    TEXT[] NOT NULL DEFAULT '{}',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_pages_menu ON menu_pages (menu_id);

CREATE TRIGGER trg_menu_pages_updated_at
  BEFORE UPDATE ON menu_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
