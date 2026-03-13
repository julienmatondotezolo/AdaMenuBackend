-- ============================================================================
-- Published Menus — QR code public access
-- ============================================================================
-- Stores menu snapshots published for QR code ordering.
-- Each record contains the full menu data + template design so the
-- public /qr/:menuId page can render without authentication.
-- Backend uses service role key which bypasses RLS.
-- ============================================================================

CREATE TABLE published_menus (
  id              TEXT PRIMARY KEY,                -- matches frontend menu ID (e.g. "menu-abc123")
  restaurant_id   UUID NOT NULL,
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
