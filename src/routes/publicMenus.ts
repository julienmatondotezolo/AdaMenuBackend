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
// No authentication required. Hybrid: template visuals come from the published
// snapshot (publish-gated), but categories + items are fetched live so that
// hide/unhide takes effect immediately on the customer side without requiring
// a republish. Returns the same shape as before so QrMenuViewer is unchanged.
router.get("/:menuId", async (req: Request, res: Response): Promise<void> => {
  const { menuId } = req.params;
  try {
    const supabase = getSupabase();

    // 1. Snapshot — gates whether the menu is publicly accessible at all,
    //    and provides template_data (colors/fonts/layouts) which is still
    //    publish-gated since it's a design choice.
    const { data: snapshot, error: snapErr } = await supabase
      .from("published_menus")
      .select("id, title, restaurant_id, menu_data, template_data, updated_at")
      .eq("id", menuId)
      .maybeSingle();

    if (snapErr) throw snapErr;
    if (!snapshot) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found or not published" });
      return;
    }

    // 2. Live categories (top-level only, hidden filtered)
    const { data: categories, error: catErr } = await supabase
      .from("menu_categories")
      .select("id, display_order, hidden, menu_category_names ( language, name )")
      .eq("menu_id", menuId)
      .eq("hidden", false)
      .is("parent_category_id", null)
      .order("display_order", { ascending: true });

    if (catErr) throw catErr;

    // 3. Live items (hidden filtered)
    const { data: items, error: itemErr } = await supabase
      .from("menu_builder_items")
      .select(`
        id, category_id, price, featured, display_order,
        menu_builder_item_names ( language, name ),
        menu_builder_item_descriptions ( language, description )
      `)
      .eq("menu_id", menuId)
      .eq("hidden", false)
      .order("display_order", { ascending: true });

    if (itemErr) throw itemErr;

    // Helpers to pick the first localized string (matches the editor's behavior)
    const pickName = (rows: Array<{ language: string; name: string }> | null | undefined): string => {
      if (!rows || rows.length === 0) return "";
      return rows.find((r) => r.language === "en")?.name || rows[0]?.name || "";
    };
    const pickDescription = (rows: Array<{ language: string; description: string }> | null | undefined): string => {
      if (!rows || rows.length === 0) return "";
      return rows.find((r) => r.language === "en")?.description || rows[0]?.description || "";
    };

    // 4. Group items by category_id and shape them for the QR menu renderer
    const itemsByCategory = new Map<string, any[]>();
    for (const item of items || []) {
      const arr = itemsByCategory.get(item.category_id) ?? [];
      arr.push({
        id: item.id,
        name: pickName((item as any).menu_builder_item_names),
        price: typeof item.price === "string" ? parseFloat(item.price) || 0 : item.price ?? 0,
        description: pickDescription((item as any).menu_builder_item_descriptions),
        featured: !!item.featured,
      });
      itemsByCategory.set(item.category_id, arr);
    }

    // 5. Build the live categories array in the shape the frontend expects
    const liveCategories = (categories || []).map((cat: any) => ({
      id: cat.id,
      name: pickName(cat.menu_category_names),
      items: itemsByCategory.get(cat.id) || [],
    }));

    // 6. Merge live menu content with the snapshot's blob (so any other fields
    //    the editor stored — established, highlight, etc. — survive).
    const mergedMenuData = {
      ...(snapshot.menu_data || {}),
      title: snapshot.title,
      categories: liveCategories,
    };

    // Never cache: the QR menu must reflect the latest hide/edit state
    // immediately. The service worker on the customer also bypasses /api/.
    res.set("Cache-Control", "no-store, must-revalidate");
    res.json({
      data: {
        menu: {
          id: snapshot.id,
          title: snapshot.title,
          restaurantId: snapshot.restaurant_id,
          data: mergedMenuData,
          updatedAt: snapshot.updated_at,
        },
        template: snapshot.template_data,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
