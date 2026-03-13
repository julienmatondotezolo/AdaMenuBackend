-- ============================================================================
-- Published Menus — QR code public access
-- ============================================================================
-- Stores menu snapshots published for QR code ordering.
-- Each record contains the full menu data + template design so the
-- public /qr/:menuId page can render without authentication.
-- ============================================================================

CREATE TABLE published_menus (
  id              TEXT PRIMARY KEY,                -- matches frontend menu ID (e.g. "menu-abc123")
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  menu_data       JSONB NOT NULL DEFAULT '{}',     -- full MenuData snapshot (categories, items, etc.)
  template_data   JSONB NOT NULL DEFAULT '{}',     -- template design snapshot (colors, fonts, webLayoutQr, qrOrderConfig, etc.)
  published_by    UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_published_menus_restaurant ON published_menus (restaurant_id);

-- Auto-update timestamp
CREATE TRIGGER trg_published_menus_updated_at
  BEFORE UPDATE ON published_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE published_menus ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their restaurant's published menus
CREATE POLICY "Users can manage own restaurant published menus"
  ON published_menus FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users
      WHERE user_id = auth.uid()
    )
  );

-- Public can read published menus (for QR code access)
CREATE POLICY "Public can read published menus"
  ON published_menus FOR SELECT
  USING (true);
