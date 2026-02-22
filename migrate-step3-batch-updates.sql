-- STEP 3: Update records in small batches to avoid timeouts
-- Run these one by one, wait between each

-- First check how many records need updating:
SELECT COUNT(*) as categories_to_update FROM categories WHERE restaurant_id IS NULL;
SELECT COUNT(*) as menu_items_to_update FROM menu_items WHERE restaurant_id IS NULL;

-- Update categories in batches of 50
UPDATE categories 
SET restaurant_id = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
WHERE id IN (
  SELECT id FROM categories 
  WHERE restaurant_id IS NULL 
  LIMIT 50
);

-- Check remaining categories
SELECT COUNT(*) as categories_remaining FROM categories WHERE restaurant_id IS NULL;

-- Update menu_items in batches of 50  
UPDATE menu_items 
SET restaurant_id = 'c1cbea71-ece5-4d63-bb12-fe06b03d1140'
WHERE id IN (
  SELECT id FROM menu_items 
  WHERE restaurant_id IS NULL 
  LIMIT 50
);

-- Check remaining menu_items
SELECT COUNT(*) as menu_items_remaining FROM menu_items WHERE restaurant_id IS NULL;

-- Repeat the UPDATE statements above until both counts are 0