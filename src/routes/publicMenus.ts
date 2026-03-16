import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase";

const router = Router();

// ─── GET /api/v1/public/menus/restaurant/:restaurantId — Current menu ───────
// No authentication required. Returns the current (most recently updated,
// non-disabled) menu for a restaurant as an array of categories with nested items.
router.get("/restaurant/:restaurantId", async (req: Request, res: Response): Promise<void> => {
  const { restaurantId } = req.params;

  try {
    const supabase = getSupabase();

    // Find the most recently updated, non-disabled menu for this restaurant
    const { data: menu, error: menuErr } = await supabase
      .from("menus")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("disabled", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (menuErr) throw menuErr;
    if (!menu) {
      res.status(404).json({ error: "NOT_FOUND", message: "No active menu found for this restaurant" });
      return;
    }

    // Categories with names
    const { data: categories, error: catErr } = await supabase
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("menu_id", menu.id)
      .is("parent_category_id", null)
      .order("display_order", { ascending: true });

    if (catErr) throw catErr;

    // Subcategories
    const { data: subcategories, error: subErr } = await supabase
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("menu_id", menu.id)
      .not("parent_category_id", "is", null)
      .order("display_order", { ascending: true });

    if (subErr) throw subErr;

    // Items with names, descriptions, allergens, side dishes, supplements
    const { data: items, error: itemErr } = await supabase
      .from("menu_builder_items")
      .select(`
        *,
        menu_builder_item_names ( language, name ),
        menu_builder_item_descriptions ( language, description ),
        menu_builder_item_allergens ( allergen_id ),
        menu_builder_item_side_dishes ( side_dish_id ),
        menu_builder_item_supplements ( supplement_id )
      `)
      .eq("menu_id", menu.id)
      .eq("hidden", false)
      .order("display_order", { ascending: true });

    if (itemErr) throw itemErr;

    // Group items by category_id
    const itemsByCategory = new Map<string, any[]>();
    for (const item of items || []) {
      const catId = item.category_id;
      if (!itemsByCategory.has(catId)) itemsByCategory.set(catId, []);
      itemsByCategory.get(catId)!.push({
        id: item.id,
        price: item.price,
        image_url: item.image_url,
        featured: item.featured,
        display_order: item.display_order,
        names: item.menu_builder_item_names || [],
        descriptions: item.menu_builder_item_descriptions || [],
        allergen_ids: (item.menu_builder_item_allergens || []).map((r: any) => r.allergen_id),
        side_dish_ids: (item.menu_builder_item_side_dishes || []).map((r: any) => r.side_dish_id),
        supplement_ids: (item.menu_builder_item_supplements || []).map((r: any) => r.supplement_id),
      });
    }

    // Group subcategories by parent
    const subByParent = new Map<string, any[]>();
    for (const sub of subcategories || []) {
      const parentId = sub.parent_category_id;
      if (!subByParent.has(parentId)) subByParent.set(parentId, []);
      subByParent.get(parentId)!.push({
        id: sub.id,
        names: sub.menu_category_names || [],
        display_order: sub.display_order,
        items: itemsByCategory.get(sub.id) || [],
      });
    }

    // Build response: array of top-level categories with nested items + subcategories
    const result = (categories || [])
      .filter((cat: any) => !cat.hidden)
      .map((cat: any) => ({
        id: cat.id,
        names: cat.menu_category_names || [],
        display_order: cat.display_order,
        items: itemsByCategory.get(cat.id) || [],
        subcategories: subByParent.get(cat.id) || [],
      }));

    res.json({
      data: {
        menu: {
          id: menu.id,
          title: menu.title,
          subtitle: menu.subtitle,
          status: menu.status,
          updated_at: menu.updated_at,
        },
        categories: result,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /api/v1/public/menus/:menuId — Public QR menu access ──────────────
// No authentication required. Returns the published menu snapshot.
router.get("/:menuId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("published_menus")
      .select("id, title, menu_data, template_data, updated_at")
      .eq("id", req.params.menuId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found or not published" });
      return;
    }

    res.json({
      data: {
        menu: {
          id: data.id,
          title: data.title,
          data: data.menu_data,
          updatedAt: data.updated_at,
        },
        template: data.template_data,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
