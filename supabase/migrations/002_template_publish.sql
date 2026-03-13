ALTER TABLE menu_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE menu_templates ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE menu_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE menu_templates ADD COLUMN IF NOT EXISTS published_by UUID;

CREATE UNIQUE INDEX IF NOT EXISTS unique_default_template_per_restaurant
  ON menu_templates (restaurant_id) WHERE is_default = true;
