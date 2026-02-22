-- Check how many records exist before migration
SELECT 'categories' as table_name, COUNT(*) as total_records FROM categories
UNION ALL
SELECT 'menu_items' as table_name, COUNT(*) as total_records FROM menu_items
UNION ALL  
SELECT 'restaurants' as table_name, COUNT(*) as total_records FROM restaurants;