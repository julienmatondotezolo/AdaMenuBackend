-- STEP 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items (restaurant_id);