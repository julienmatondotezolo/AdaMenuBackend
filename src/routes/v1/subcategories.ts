import { Router, Request, Response } from "express";
import { requireAuth, requireRestaurantAccess } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { adminLimiter } from "../../middleware/rate-limit";
import {
  createSubcategorySchema,
  updateSubcategorySchema,
  reorderSchema,
} from "../../validation/schemas";
import { getSupabase } from "../../services/supabase";

const router = Router({ mergeParams: true });

router.use(adminLimiter);
router.use(requireAuth);
router.use(requireRestaurantAccess);

// ─── GET ────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    let query = supabase
      .from("subcategories")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId)
      .order("sort_order", { ascending: true });

    if (req.params.categoryId) {
      query = query.eq("category_id", req.params.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── POST ───────────────────────────────────────────────────────────────────
router.post(
  "/",
  validate(createSubcategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const categoryId = req.params.categoryId;
      if (!categoryId) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "categoryId is required to create a subcategory. Use POST /restaurants/:id/categories/:categoryId/subcategories",
        });
        return;
      }

      // Verify category belongs to restaurant
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId)
        .eq("restaurant_id", req.params.restaurantId)
        .single();

      if (!category) {
        res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
        return;
      }

      const { data: maxRow } = await supabase
        .from("subcategories")
        .select("sort_order")
        .eq("category_id", categoryId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxRow?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("subcategories")
        .insert({
          ...req.body,
          category_id: categoryId,
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

// ─── PATCH /:id ─────────────────────────────────────────────────────────────
router.patch(
  "/:id",
  validate(updateSubcategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    const supabase = req.supabaseClient || getSupabase();
    if (!supabase) {
      res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subcategories")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("restaurant_id", req.params.restaurantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Subcategory not found" });
        return;
      }

      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

// ─── DELETE /:id ────────────────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const supabase = req.supabaseClient || getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Database not configured" });
    return;
  }

  try {
    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", req.params.id)
      .eq("restaurant_id", req.params.restaurantId);

    if (error) throw error;

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// ─── PUT /reorder ───────────────────────────────────────────────────────────
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
            .from("subcategories")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
            .eq("restaurant_id", req.params.restaurantId)
      );

      await Promise.all(updates);

      res.json({ message: "Subcategories reordered successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "SERVER_ERROR", message: err.message });
    }
  }
);

export default router;
