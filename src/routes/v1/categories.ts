import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import {
  createCategorySchema,
  updateCategorySchema,
  reorderSchema,
} from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── GET /api/v1/restaurants/:restaurantId/categories ───────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select(`
        *,
        subcategories (
          id, name, sort_order, visible, created_at, updated_at
        )
      `)
      .eq("restaurant_id", req.params.restaurantId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // Sort subcategories within each category
    for (const cat of categories || []) {
      if (cat.subcategories) {
        cat.subcategories.sort((a: any, b: any) => a.sort_order - b.sort_order);
      }
    }

    res.json({ data: categories || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST /api/v1/restaurants/:restaurantId/categories ──────────────────────
router.post(
  "/",
  validate(createCategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data: maxRow } = await supabase
        .from("categories")
        .select("sort_order")
        .eq("restaurant_id", req.params.restaurantId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxRow?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("categories")
        .insert({
          ...req.body,
          restaurant_id: req.params.restaurantId,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── PATCH /api/v1/restaurants/:restaurantId/categories/:id ─────────────────
router.patch(
  "/:id",
  validate(updateCategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /api/v1/restaurants/:restaurantId/categories/:id ────────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", req.params.id)
      .eq("restaurant_id", req.params.restaurantId);

    if (error) throw error;

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PUT /api/v1/restaurants/:restaurantId/categories/reorder ───────────────
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
            .from("categories")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
            .eq("restaurant_id", req.params.restaurantId)
      );

      await Promise.all(updates);

      res.json({ message: "Categories reordered successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

export default router;
