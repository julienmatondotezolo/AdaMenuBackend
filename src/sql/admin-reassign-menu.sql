-- Admin-only RPC: move a menu (and all its categories + items) to a different restaurant.
-- Wraps the cascade in a Postgres transaction so a partial reassignment cannot happen.
-- Apply via Supabase SQL Editor on dxxtxdyrovawugvvrhah.supabase.co.
--
-- Error codes raised:
--   MENU_PUBLISHED  → menu has a row in published_menus; unpublish first
--   MENU_NOT_FOUND  → no menus row matches p_menu_id
--   RESTAURANT_NOT_FOUND → no restaurants row matches p_new_restaurant_id

CREATE OR REPLACE FUNCTION admin_reassign_menu(
  p_menu_id uuid,
  p_new_restaurant_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_restaurant_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = p_new_restaurant_id) THEN
    RAISE EXCEPTION 'RESTAURANT_NOT_FOUND';
  END IF;

  SELECT restaurant_id INTO v_old_restaurant_id
  FROM menus WHERE id = p_menu_id;

  IF v_old_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'MENU_NOT_FOUND';
  END IF;

  -- published_menus.id is stored as text (legacy schema), so cast for comparison
  IF EXISTS (SELECT 1 FROM published_menus WHERE id = p_menu_id::text) THEN
    RAISE EXCEPTION 'MENU_PUBLISHED';
  END IF;

  UPDATE menus
     SET restaurant_id = p_new_restaurant_id,
         updated_at = now()
   WHERE id = p_menu_id;

  UPDATE menu_categories
     SET restaurant_id = p_new_restaurant_id
   WHERE menu_id = p_menu_id;

  -- menu_items have no restaurant_id column; they cascade via category_id

  RETURN json_build_object(
    'success', true,
    'menu_id', p_menu_id,
    'old_restaurant_id', v_old_restaurant_id,
    'new_restaurant_id', p_new_restaurant_id
  );
END;
$$;
