import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  bulkMenuItemSchema,
  reorderSchema,
  eightySixSchema,
} from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── Helper: sync junction tables for a menu item ───────────────────────────
async function syncRelations(
  supabase: any,
  menuItemId: string,
  body: {
    allergen_ids?: string[];
    side_dish_ids?: string[];
    supplement_ids?: string[];
  }
) {
  if (body.allergen_ids !== undefined) {
    await supabase
      .from("menu_item_allergens")
      .delete()
      .eq("menu_item_id", menuItemId);

    if (body.allergen_ids.length > 0) {
      await supabase.from("menu_item_allergens").insert(
        body.allergen_ids.map((id: string) => ({
          menu_item_id: menuItemId,
          allergen_id: id,
        }))
      );
    }
  }

  if (body.side_dish_ids !== undefined) {
    await supabase
      .from("menu_item_side_dishes")
      .delete()
      .eq("menu_item_id", menuItemId);

    if (body.side_dish_ids.length > 0) {
      await supabase.from("menu_item_side_dishes").insert(
        body.side_dish_ids.map((id: string) => ({
          menu_item_id: menuItemId,
          side_dish_id: id,
        }))
      );
    }
  }

  if (body.supplement_ids !== undefined) {
    await supabase
      .from("menu_item_supplements")
      .delete()
      .eq("menu_item_id", menuItemId);

    if (body.supplement_ids.length > 0) {
      await supabase.from("menu_item_supplements").insert(
        body.supplement_ids.map((id: string) => ({
          menu_item_id: menuItemId,
          supplement_id: id,
        }))
      );
    }
  }
}

// ─── GET /api/v1/restaurants/:restaurantId/menu-items ───────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const query = req.query as Record<string, string>;
    const page = query.page ? parseInt(query.page) : 1;
    const limit = Math.min(query.limit ? parseInt(query.limit) : 50, 200);
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from("menu_items")
      .select(
        `
        *,
        menu_item_allergens ( allergen:allergens(*) ),
        menu_item_side_dishes ( side_dish:side_dishes(*) ),
        menu_item_supplements ( supplement:supplements(*) )
      `,
        { count: "exact" }
      )
      .eq("restaurant_id", req.params.restaurantId)
      .order("sort_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (query.subcategory_id) {
      dbQuery = dbQuery.eq("subcategory_id", query.subcategory_id);
    }

    if (query.category_id) {
      const { data: subcats } = await supabase
        .from("subcategories")
        .select("id")
        .eq("category_id", query.category_id)
        .eq("restaurant_id", req.params.restaurantId);

      if (subcats && subcats.length > 0) {
        dbQuery = dbQuery.in(
          "subcategory_id",
          subcats.map((s: any) => s.id)
        );
      }
    }

    if (query.available !== undefined) {
      dbQuery = dbQuery.eq("available", query.available === "true");
    }

    const { data, error, count } = await dbQuery;
    if (error) throw error;

    // Flatten junction relations
    const items = (data || []).map((item: any) => ({
      ...item,
      allergens: (item.menu_item_allergens || []).map((j: any) => j.allergen).filter(Boolean),
      side_dishes: (item.menu_item_side_dishes || []).map((j: any) => j.side_dish).filter(Boolean),
      supplements: (item.menu_item_supplements || []).map((j: any) => j.supplement).filter(Boolean),
      menu_item_allergens: undefined,
      menu_item_side_dishes: undefined,
      menu_item_supplements: undefined,
    }));

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST /api/v1/restaurants/:restaurantId/menu-items ──────────────────────
router.post(
  "/",
  validate(createMenuItemSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { allergen_ids, side_dish_ids, supplement_ids, ...itemData } = req.body;

      const { data: maxRow } = await supabase
        .from("menu_items")
        .select("sort_order")
        .eq("subcategory_id", itemData.subcategory_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxRow?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          ...itemData,
          restaurant_id: req.params.restaurantId,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      await syncRelations(supabase, data.id, { allergen_ids, side_dish_ids, supplement_ids });

      res.status(201).json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── POST /api/v1/restaurants/:restaurantId/menu-items/bulk ─────────────────
router.post(
  "/bulk",
  validate(bulkMenuItemSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const results: any[] = [];

      for (const item of req.body.items) {
        const { id, allergen_ids, side_dish_ids, supplement_ids, ...fields } = item;

        if (id) {
          const { data, error } = await supabase
            .from("menu_items")
            .update(fields)
            .eq("id", id)
            .eq("restaurant_id", req.params.restaurantId)
            .select()
            .single();

          if (error) throw error;

          if (allergen_ids || side_dish_ids || supplement_ids) {
            await syncRelations(supabase, id, { allergen_ids, side_dish_ids, supplement_ids });
          }

          results.push(data);
        } else {
          const { data, error } = await supabase
            .from("menu_items")
            .insert({
              ...fields,
              restaurant_id: req.params.restaurantId,
            })
            .select()
            .single();

          if (error) throw error;

          if (allergen_ids || side_dish_ids || supplement_ids) {
            await syncRelations(supabase, data.id, { allergen_ids, side_dish_ids, supplement_ids });
          }

          results.push(data);
        }
      }

      res.json({ data: results, count: results.length });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PATCH /api/v1/restaurants/:restaurantId/menu-items/:id ─────────────────
router.patch(
  "/:id",
  validate(updateMenuItemSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { allergen_ids, side_dish_ids, supplement_ids, ...fields } = req.body;

      let data: any;
      if (Object.keys(fields).length > 0) {
        const result = await supabase
          .from("menu_items")
          .update(fields)
          .eq("id", req.params.id)
          .eq("restaurant_id", req.params.restaurantId)
          .select()
          .single();

        if (result.error) throw result.error;
        data = result.data;
      } else {
        const result = await supabase
          .from("menu_items")
          .select("*")
          .eq("id", req.params.id)
          .eq("restaurant_id", req.params.restaurantId)
          .single();

        if (result.error) throw result.error;
        data = result.data;
      }

      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Menu item not found" });
        return;
      }

      const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      await syncRelations(supabase, itemId, { allergen_ids, side_dish_ids, supplement_ids });

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId/menu-items/:id ────────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", req.params.id)
      .eq("restaurant_id", req.params.restaurantId);

    if (error) throw error;

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PATCH /api/v1/restaurants/:restaurantId/menu-items/:id/86 ──────────────
// Quick 86 (out of stock) toggle — designed for mobile-first, single-tap usage
router.patch(
  "/:id/86",
  validate(eightySixSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { is_86d, eighty_sixed_until } = req.body;

      const updateData: Record<string, any> = {
        is_86d,
        eighty_sixed_at: is_86d ? new Date().toISOString() : null,
        eighty_sixed_until: is_86d ? (eighty_sixed_until || null) : null,
      };

      const { data, error } = await supabase
        .from("menu_items")
        .update(updateData)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Menu item not found" });
        return;
      }

      // Clear menu cache so widget shows updated status quickly
      // (in a real system, this would also fire a webhook/SSE event)

      res.json({
        data,
        message: is_86d
          ? `Item 86'd${eighty_sixed_until ? " until " + eighty_sixed_until : ""}`
          : "Item back on menu",
      });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PUT /api/v1/restaurants/:restaurantId/menu-items/reorder ───────────────
router.put(
  "/reorder",
  validate(reorderSchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const updates = req.body.order.map(
        (item: { id: string; sort_order: number }) =>
          supabase
            .from("menu_items")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
            .eq("restaurant_id", req.params.restaurantId)
      );

      await Promise.all(updates);

      res.json({ message: "Menu items reordered successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

export default router;
