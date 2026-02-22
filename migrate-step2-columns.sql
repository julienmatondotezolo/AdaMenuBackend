-- STEP 2: Add restaurant_id columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);