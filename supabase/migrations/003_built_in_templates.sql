-- ============================================================================
-- AdaMenu — Built-in Templates
-- ============================================================================
-- Global template library (not restaurant-scoped).
-- Admins can edit these; they sync to frontend IndexedDB on load.
-- ============================================================================

CREATE TABLE built_in_templates (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  thumbnail       TEXT,
  format          JSONB NOT NULL,
  orientation     TEXT NOT NULL DEFAULT 'portrait'
    CHECK (orientation IN ('portrait', 'landscape')),
  colors          JSONB NOT NULL,
  fonts           JSONB NOT NULL,
  spacing         JSONB NOT NULL,
  page_variants   JSONB NOT NULL DEFAULT '[]',
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_built_in_templates_updated_at
  BEFORE UPDATE ON built_in_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed built-in templates
-- ============================================================================

INSERT INTO built_in_templates (id, name, description, format, orientation, colors, fonts, spacing, page_variants)
VALUES
  (
    'tpl-lumiere-dining',
    'Lumière Dining',
    'Elegant centered serif layout with decorative lines and highlight image',
    '{"type": "A4", "width": 210, "height": 297}',
    'portrait',
    '{"primary": "#4d5cc5", "background": "#ffffff", "text": "#0a1029", "accent": "#4d5cc5", "muted": "#6b7280"}',
    '{"heading": "''Playfair Display'', serif", "body": "''DM Sans'', sans-serif"}',
    '{"marginTop": 48, "marginBottom": 24, "marginLeft": 32, "marginRight": 32, "categoryGap": 40, "itemGap": 24}',
    '[
      {"id": "cover", "name": "Cover", "header": {"show": true, "style": "centered", "showSubtitle": true, "showEstablished": true, "showDivider": true}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "line", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "content", "name": "Content", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "line", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "content-image", "name": "Content + Image", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "line", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": true, "position": "bottom", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "back-cover", "name": "Back Cover", "header": {"show": true, "style": "minimal", "showSubtitle": false, "showEstablished": true, "showDivider": true}, "body": {"columns": 1, "categoryStyle": "minimal", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "none", "showDescriptions": false, "showFeaturedBadge": false}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}}
    ]'
  ),
  (
    'tpl-trattoria-rustica',
    'Trattoria Rustica',
    'Warm Italian-inspired layout with earthy tones, left-aligned with dotted price lines',
    '{"type": "A4", "width": 210, "height": 297}',
    'portrait',
    '{"primary": "#8b4513", "background": "#faf6f1", "text": "#2c1810", "accent": "#c4783e", "muted": "#8c7b6b"}',
    '{"heading": "''Cormorant Garamond'', serif", "body": "''Lora'', serif"}',
    '{"marginTop": 40, "marginBottom": 28, "marginLeft": 36, "marginRight": 36, "categoryGap": 36, "itemGap": 20}',
    '[
      {"id": "cover", "name": "Cover", "header": {"show": true, "style": "centered", "showSubtitle": true, "showEstablished": true, "showDivider": true}, "body": {"columns": 1, "categoryStyle": "bold", "itemAlignment": "left", "pricePosition": "right", "separatorStyle": "dotted", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": true, "position": "top", "style": "fit", "height": 100, "marginTop": 0, "marginBottom": 16, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "content", "name": "Menu", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 1, "categoryStyle": "bold", "itemAlignment": "left", "pricePosition": "right", "separatorStyle": "dotted", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}}
    ]'
  ),
  (
    'tpl-modern-noir',
    'Modern Noir',
    'Dark sophisticated layout with bold sans-serif typography and minimal accents',
    '{"type": "A4", "width": 210, "height": 297}',
    'portrait',
    '{"primary": "#d4af37", "background": "#1a1a1a", "text": "#f5f5f0", "accent": "#d4af37", "muted": "#888880"}',
    '{"heading": "''Bebas Neue'', sans-serif", "body": "''Montserrat'', sans-serif"}',
    '{"marginTop": 52, "marginBottom": 32, "marginLeft": 40, "marginRight": 40, "categoryGap": 44, "itemGap": 22}',
    '[
      {"id": "cover", "name": "Cover", "header": {"show": true, "style": "centered", "showSubtitle": true, "showEstablished": false, "showDivider": true}, "body": {"columns": 2, "categoryStyle": "minimal", "itemAlignment": "left", "pricePosition": "right", "separatorStyle": "line", "showDescriptions": false, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "content", "name": "Menu", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 2, "categoryStyle": "minimal", "itemAlignment": "left", "pricePosition": "right", "separatorStyle": "line", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": true, "position": "bottom", "style": "fit", "height": 90, "marginTop": 16, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}}
    ]'
  ),
  (
    'tpl-garden-bistro',
    'Garden Bistro',
    'Fresh green-accented layout with handwritten heading and airy spacing',
    '{"type": "DL", "width": 99, "height": 210}',
    'portrait',
    '{"primary": "#2d6a4f", "background": "#f8faf6", "text": "#1b3a26", "accent": "#52b788", "muted": "#74917e"}',
    '{"heading": "''Dancing Script'', cursive", "body": "''Nunito Sans'', sans-serif"}',
    '{"marginTop": 32, "marginBottom": 20, "marginLeft": 20, "marginRight": 20, "categoryGap": 28, "itemGap": 16}',
    '[
      {"id": "front", "name": "Front", "header": {"show": true, "style": "centered", "showSubtitle": true, "showEstablished": false, "showDivider": true}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "line", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "back", "name": "Back", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "below", "separatorStyle": "line", "showDescriptions": false, "showFeaturedBadge": false}, "highlight": {"show": true, "position": "bottom", "style": "fit", "height": 60, "marginTop": 8, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}}
    ]'
  ),
  (
    'tpl-parisian-chic',
    'Parisian Chic',
    'Refined French-inspired layout with DM Serif headings and clean structure',
    '{"type": "A5", "width": 148, "height": 210}',
    'portrait',
    '{"primary": "#1a1a2e", "background": "#fefefe", "text": "#1a1a2e", "accent": "#c9a96e", "muted": "#9ca3af"}',
    '{"heading": "''DM Serif Display'', serif", "body": "''Poppins'', sans-serif"}',
    '{"marginTop": 36, "marginBottom": 20, "marginLeft": 24, "marginRight": 24, "categoryGap": 32, "itemGap": 18}',
    '[
      {"id": "cover", "name": "Cover", "header": {"show": true, "style": "centered", "showSubtitle": true, "showEstablished": true, "showDivider": true}, "body": {"columns": 1, "categoryStyle": "lines", "itemAlignment": "center", "pricePosition": "inline", "separatorStyle": "none", "showDescriptions": true, "showFeaturedBadge": true}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}},
      {"id": "content", "name": "Carte", "header": {"show": false, "style": "none", "showSubtitle": false, "showEstablished": false, "showDivider": false}, "body": {"columns": 2, "categoryStyle": "bold", "itemAlignment": "left", "pricePosition": "right", "separatorStyle": "none", "showDescriptions": true, "showFeaturedBadge": false}, "highlight": {"show": false, "position": "none", "style": "fit", "height": 80, "marginTop": 12, "marginBottom": 0, "marginLeft": 0, "marginRight": 0, "imageFit": "cover", "imageLocked": false}}
    ]'
  );
