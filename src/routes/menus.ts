import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getSupabase } from "../lib/supabase";

const router = Router({ mergeParams: true });
router.use(requireAuth);

function rid(req: Request): string {
  return req.params.restaurantId as string;
}

function isAdmin(req: Request): boolean {
  return req.auth?.role === "admin";
}

// =============================================================================
// MENUS — CRUD
// =============================================================================

// ─── POST / — Create a menu ─────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { title, subtitle, template_id, status } = req.body;

  if (!title) {
    res.status(400).json({ error: "BAD_REQUEST", message: "title is required" });
    return;
  }

  try {
    const { data, error } = await getSupabase()
      .from("menus")
      .insert({
        restaurant_id: rid(req),
        title,
        subtitle: subtitle || null,
        template_id: template_id || null,
        status: status || "draft",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET / — List menus for restaurant ───────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    let query = getSupabase()
      .from("menus")
      .select("*")
      .eq("restaurant_id", rid(req))
      .order("updated_at", { ascending: false });

    // Non-admin users don't see disabled menus
    if (!isAdmin(req)) {
      query = query.eq("disabled", false);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /:menuId — Get single menu ─────────────────────────────────────────
router.get("/:menuId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("menus")
      .select("*")
      .eq("id", req.params.menuId)
      .eq("restaurant_id", rid(req))
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found" });
      return;
    }
    if (data.disabled && !isAdmin(req)) {
      res.status(403).json({ error: "MENU_DISABLED", message: "This menu has been deleted" });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /:menuId/complete — Full nested menu for KDS / frontend ────────────
router.get("/:menuId/complete", async (req: Request, res: Response): Promise<void> => {
  const { menuId } = req.params;
  const restaurantId = rid(req);

  try {
    const supabase = getSupabase();

    // Menu
    const { data: menu, error: menuErr } = await supabase
      .from("menus")
      .select("*")
      .eq("id", menuId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (menuErr) throw menuErr;
    if (!menu) {
      res.status(404).json({ error: "NOT_FOUND", message: "Menu not found" });
      return;
    }
    if (menu.disabled && !isAdmin(req)) {
      res.status(403).json({ error: "MENU_DISABLED", message: "This menu has been deleted" });
      return;
    }

    // Categories with names
    const { data: categories, error: catErr } = await supabase
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("menu_id", menuId)
      .order("display_order", { ascending: true });

    if (catErr) throw catErr;

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
      .eq("menu_id", menuId)
      .order("display_order", { ascending: true });

    if (itemErr) throw itemErr;

    // Pages
    const { data: pages, error: pageErr } = await supabase
      .from("menu_pages")
      .select("*")
      .eq("menu_id", menuId)
      .order("sort_order", { ascending: true });

    if (pageErr) throw pageErr;

    // ── Build nested structure ──────────────────────────────────────────
    const allCats = categories || [];
    const allItems = items || [];

    // Group items by category_id
    const itemsByCategory = new Map<string, any[]>();
    for (const item of allItems) {
      const catId = item.category_id;
      if (!itemsByCategory.has(catId)) itemsByCategory.set(catId, []);
      itemsByCategory.get(catId)!.push({
        ...item,
        names: item.menu_builder_item_names || [],
        descriptions: item.menu_builder_item_descriptions || [],
        allergen_ids: (item.menu_builder_item_allergens || []).map((r: any) => r.allergen_id),
        side_dish_ids: (item.menu_builder_item_side_dishes || []).map((r: any) => r.side_dish_id),
        supplement_ids: (item.menu_builder_item_supplements || []).map((r: any) => r.supplement_id),
        menu_builder_item_names: undefined,
        menu_builder_item_descriptions: undefined,
        menu_builder_item_allergens: undefined,
        menu_builder_item_side_dishes: undefined,
        menu_builder_item_supplements: undefined,
      });
    }

    // Separate top-level categories and subcategories
    const topCategories: any[] = [];
    const subByParent = new Map<string, any[]>();

    for (const cat of allCats) {
      const enriched = {
        ...cat,
        names: cat.menu_category_names || [],
        menu_category_names: undefined,
        items: itemsByCategory.get(cat.id) || [],
      };

      if (cat.parent_category_id) {
        if (!subByParent.has(cat.parent_category_id)) subByParent.set(cat.parent_category_id, []);
        subByParent.get(cat.parent_category_id)!.push(enriched);
      } else {
        topCategories.push(enriched);
      }
    }

    for (const cat of topCategories) {
      cat.subcategories = subByParent.get(cat.id) || [];
    }

    res.json({
      data: {
        ...menu,
        categories: topCategories,
        pages: pages || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /:menuId/disable — Soft-delete (owner sets disabled=true) ────────
// NOTE: Must be defined before PATCH /:menuId to avoid route shadowing
router.patch("/:menuId/disable", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("menus")
      .update({ disabled: true })
      .eq("id", req.params.menuId)
      .eq("restaurant_id", rid(req))
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /:menuId/enable — Re-enable a disabled menu (admin only) ─────────
router.patch("/:menuId/enable", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Only admins can re-enable menus" });
    return;
  }

  try {
    const { data, error } = await getSupabase()
      .from("menus")
      .update({ disabled: false })
      .eq("id", req.params.menuId)
      .eq("restaurant_id", rid(req))
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /:menuId — Update menu metadata ──────────────────────────────────
router.patch("/:menuId", async (req: Request, res: Response): Promise<void> => {
  const { title, subtitle, template_id, status } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (template_id !== undefined) updates.template_id = template_id;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "BAD_REQUEST", message: "No fields to update" });
    return;
  }

  try {
    const { data, error } = await getSupabase()
      .from("menus")
      .update(updates)
      .eq("id", req.params.menuId)
      .eq("restaurant_id", rid(req))
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── DELETE /:menuId — Hard delete (admin only, cascades everything) ────────
router.delete("/:menuId", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "FORBIDDEN", message: "Only admins can permanently delete menus" });
    return;
  }

  try {
    const { error } = await getSupabase()
      .from("menus")
      .delete()
      .eq("id", req.params.menuId)
      .eq("restaurant_id", rid(req));

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// =============================================================================
// CATEGORIES — scoped to a menu
// =============================================================================

// ─── POST /:menuId/categories ───────────────────────────────────────────────
router.post("/:menuId/categories", async (req: Request, res: Response): Promise<void> => {
  const { names, parent_category_id, hidden, display_order } = req.body;

  if (!names || !Array.isArray(names) || names.length === 0) {
    res.status(400).json({ error: "BAD_REQUEST", message: "names array is required" });
    return;
  }

  try {
    const supabase = getSupabase();

    const { data: cat, error: catErr } = await supabase
      .from("menu_categories")
      .insert({
        menu_id: req.params.menuId,
        restaurant_id: rid(req),
        parent_category_id: parent_category_id || null,
        hidden: hidden ?? false,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (catErr) throw catErr;

    const nameRows = names.map((n: any) => ({
      category_id: cat.id,
      language: n.language,
      name: n.name,
    }));
    await supabase.from("menu_category_names").insert(nameRows);

    const { data: full, error: fullErr } = await supabase
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("id", cat.id)
      .single();

    if (fullErr) throw fullErr;
    res.status(201).json({ data: full });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── GET /:menuId/categories ────────────────────────────────────────────────
router.get("/:menuId/categories", async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await getSupabase()
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("menu_id", req.params.menuId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /:menuId/categories/:catId ───────────────────────────────────────
router.patch("/:menuId/categories/:catId", async (req: Request, res: Response): Promise<void> => {
  const { names, hidden, display_order, parent_category_id } = req.body;

  try {
    const supabase = getSupabase();

    const updates: Record<string, any> = {};
    if (hidden !== undefined) updates.hidden = hidden;
    if (display_order !== undefined) updates.display_order = display_order;
    if (parent_category_id !== undefined) updates.parent_category_id = parent_category_id;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("menu_categories")
        .update(updates)
        .eq("id", req.params.catId)
        .eq("menu_id", req.params.menuId);

      if (error) throw error;
    }

    if (names && Array.isArray(names)) {
      await supabase.from("menu_category_names").delete().eq("category_id", req.params.catId);
      if (names.length > 0) {
        const nameRows = names.map((n: any) => ({
          category_id: req.params.catId,
          language: n.language,
          name: n.name,
        }));
        await supabase.from("menu_category_names").insert(nameRows);
      }
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .select("*, menu_category_names ( language, name )")
      .eq("id", req.params.catId)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── DELETE /:menuId/categories/:catId ──────────────────────────────────────
// CASCADE handles subcategories, items, names, etc. via FK constraints
router.delete("/:menuId/categories/:catId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await getSupabase()
      .from("menu_categories")
      .delete()
      .eq("id", req.params.catId)
      .eq("menu_id", req.params.menuId);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// =============================================================================
// MENU ITEMS — scoped to a menu
// =============================================================================

// ─── POST /:menuId/categories/:catId/items ──────────────────────────────────
router.post("/:menuId/categories/:catId/items", async (req: Request, res: Response): Promise<void> => {
  const { names, descriptions, price, hidden, display_order, featured, image_url } = req.body;

  if (!names || !Array.isArray(names) || names.length === 0) {
    res.status(400).json({ error: "BAD_REQUEST", message: "names array is required" });
    return;
  }

  try {
    const supabase = getSupabase();

    const { data: item, error: itemErr } = await supabase
      .from("menu_builder_items")
      .insert({
        menu_id: req.params.menuId,
        restaurant_id: rid(req),
        category_id: req.params.catId,
        price: price ?? 0,
        image_url: image_url || null,
        hidden: hidden ?? false,
        display_order: display_order ?? 0,
        featured: featured ?? false,
      })
      .select()
      .single();

    if (itemErr) throw itemErr;

    // Insert names
    const nameRows = names.map((n: any) => ({
      item_id: item.id,
      language: n.language,
      name: n.name,
    }));
    await supabase.from("menu_builder_item_names").insert(nameRows);

    // Insert descriptions
    if (descriptions && Array.isArray(descriptions) && descriptions.length > 0) {
      const descRows = descriptions.map((d: any) => ({
        item_id: item.id,
        language: d.language,
        description: d.description,
      }));
      await supabase.from("menu_builder_item_descriptions").insert(descRows);
    }

    const { data: full, error: fullErr } = await supabase
      .from("menu_builder_items")
      .select("*, menu_builder_item_names ( language, name ), menu_builder_item_descriptions ( language, description )")
      .eq("id", item.id)
      .single();

    if (fullErr) throw fullErr;
    res.status(201).json({ data: full });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /:menuId/items/:itemId ───────────────────────────────────────────
router.patch("/:menuId/items/:itemId", async (req: Request, res: Response): Promise<void> => {
  const { names, descriptions, price, hidden, display_order, featured, category_id, image_url } = req.body;

  try {
    const supabase = getSupabase();

    const updates: Record<string, any> = {};
    if (price !== undefined) updates.price = price;
    if (hidden !== undefined) updates.hidden = hidden;
    if (featured !== undefined) updates.featured = featured;
    if (category_id !== undefined) updates.category_id = category_id;
    if (image_url !== undefined) updates.image_url = image_url;
    if (display_order !== undefined) updates.display_order = display_order;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("menu_builder_items")
        .update(updates)
        .eq("id", req.params.itemId)
        .eq("menu_id", req.params.menuId);

      if (error) throw error;
    }

    if (names && Array.isArray(names)) {
      await supabase.from("menu_builder_item_names").delete().eq("item_id", req.params.itemId);
      if (names.length > 0) {
        const nameRows = names.map((n: any) => ({
          item_id: req.params.itemId,
          language: n.language,
          name: n.name,
        }));
        await supabase.from("menu_builder_item_names").insert(nameRows);
      }
    }

    if (descriptions && Array.isArray(descriptions)) {
      await supabase.from("menu_builder_item_descriptions").delete().eq("item_id", req.params.itemId);
      if (descriptions.length > 0) {
        const descRows = descriptions.map((d: any) => ({
          item_id: req.params.itemId,
          language: d.language,
          description: d.description,
        }));
        await supabase.from("menu_builder_item_descriptions").insert(descRows);
      }
    }

    const { data, error } = await supabase
      .from("menu_builder_items")
      .select("*, menu_builder_item_names ( language, name ), menu_builder_item_descriptions ( language, description )")
      .eq("id", req.params.itemId)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── DELETE /:menuId/items/:itemId ──────────────────────────────────────────
// CASCADE handles names, descriptions, allergens, side dishes, supplements
router.delete("/:menuId/items/:itemId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await getSupabase()
      .from("menu_builder_items")
      .delete()
      .eq("id", req.params.itemId)
      .eq("menu_id", req.params.menuId);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// =============================================================================
// MENU PAGES — layout pages per menu
// =============================================================================

// ─── PUT /:menuId/pages — Save/replace all pages ────────────────────────────
router.put("/:menuId/pages", async (req: Request, res: Response): Promise<void> => {
  const { pages } = req.body;

  if (!Array.isArray(pages)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "pages array is required" });
    return;
  }

  const menuId = req.params.menuId;

  try {
    const supabase = getSupabase();

    await supabase.from("menu_pages").delete().eq("menu_id", menuId);

    if (pages.length > 0) {
      const rows = pages.map((p: any, i: number) => ({
        menu_id: menuId,
        variant_id: p.variant_id,
        category_ids: p.category_ids || [],
        sort_order: i,
      }));

      const { error } = await supabase.from("menu_pages").insert(rows);
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from("menu_pages")
      .select("*")
      .eq("menu_id", menuId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// =============================================================================
// BULK PUBLISH — single request to replace all categories + items + pages
// =============================================================================

// ─── PUT /:menuId/bulk — Atomic replace of all menu content ─────────────────
router.put("/:menuId/bulk", async (req: Request, res: Response): Promise<void> => {
  const { categories, pages, title, subtitle, template_id, status, thumbnail } = req.body;
  const menuId = req.params.menuId;
  const restaurantId = rid(req);

  console.log(`[BULK] menuId=${menuId} restaurantId=${restaurantId} categories=${categories?.length} pages=${pages?.length} thumbnail=${thumbnail ? 'yes(' + thumbnail.length + ' chars)' : 'no'}`);
  for (const cat of (categories || [])) {
    console.log(`[BULK]   cat: "${cat.name}" items=${cat.items?.length || 0}`);
  }

  if (!Array.isArray(categories)) {
    res.status(400).json({ error: "BAD_REQUEST", message: "categories array is required" });
    return;
  }

  try {
    const supabase = getSupabase();

    // 1. Update menu metadata if provided
    const menuUpdates: Record<string, any> = {};
    if (title !== undefined) menuUpdates.title = title;
    if (subtitle !== undefined) menuUpdates.subtitle = subtitle;
    if (template_id !== undefined) menuUpdates.template_id = template_id;
    if (status !== undefined) menuUpdates.status = status;
    if (thumbnail !== undefined) menuUpdates.thumbnail = thumbnail;

    if (Object.keys(menuUpdates).length > 0) {
      const { error } = await supabase
        .from("menus")
        .update(menuUpdates)
        .eq("id", menuId)
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
    }

    // 2. Delete all existing categories (CASCADE handles items, names, etc.)
    const { data: existingCats } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("menu_id", menuId);

    if (existingCats && existingCats.length > 0) {
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("menu_id", menuId);
      if (error) throw error;
    }

    // 3. Create all categories + items in order
    const categoryIdMap: Record<string, string> = {}; // local ID → backend ID

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];

      // Insert category
      const { data: newCat, error: catErr } = await supabase
        .from("menu_categories")
        .insert({
          menu_id: menuId,
          restaurant_id: restaurantId,
          display_order: i,
        })
        .select()
        .single();

      if (catErr) throw catErr;

      // Map local ID to backend ID
      if (cat.id) categoryIdMap[cat.id] = newCat.id;

      // Insert category names
      const catNames = cat.names || [{ language: "en", name: cat.name || "" }];
      await supabase.from("menu_category_names").insert(
        catNames.map((n: any) => ({
          category_id: newCat.id,
          language: n.language,
          name: n.name,
        }))
      );

      // Insert items for this category
      const items = cat.items || [];
      for (let j = 0; j < items.length; j++) {
        const item = items[j];

        const { data: newItem, error: itemErr } = await supabase
          .from("menu_builder_items")
          .insert({
            menu_id: menuId,
            restaurant_id: restaurantId,
            category_id: newCat.id,
            price: item.price ?? 0,
            featured: item.featured ?? false,
            hidden: item.hidden ?? false,
            display_order: j,
            image_url: item.image_url || null,
          })
          .select()
          .single();

        if (itemErr) throw itemErr;

        // Item names
        const itemNames = item.names || [{ language: "en", name: item.name || "" }];
        await supabase.from("menu_builder_item_names").insert(
          itemNames.map((n: any) => ({
            item_id: newItem.id,
            language: n.language,
            name: n.name,
          }))
        );

        // Item descriptions
        const itemDescs = item.descriptions || (item.description ? [{ language: "en", description: item.description }] : []);
        if (itemDescs.length > 0) {
          await supabase.from("menu_builder_item_descriptions").insert(
            itemDescs.map((d: any) => ({
              item_id: newItem.id,
              language: d.language,
              description: d.description,
            }))
          );
        }
      }
    }

    // 4. Replace pages with remapped category IDs
    await supabase.from("menu_pages").delete().eq("menu_id", menuId);

    if (Array.isArray(pages) && pages.length > 0) {
      const pageRows = pages.map((p: any, i: number) => ({
        menu_id: menuId,
        variant_id: p.variant_id,
        category_ids: (p.category_ids || []).map((id: string) => categoryIdMap[id] || id),
        sort_order: i,
      }));

      const { error: pageErr } = await supabase.from("menu_pages").insert(pageRows);
      if (pageErr) throw pageErr;
    }

    // 5. Return the new category ID mapping so frontend can update local state
    console.log(`[BULK] SUCCESS — created ${Object.keys(categoryIdMap).length} categories`);
    res.json({ data: { categoryIdMap } });
  } catch (err: any) {
    console.error(`[BULK] ERROR:`, err.message);
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

export default router;
